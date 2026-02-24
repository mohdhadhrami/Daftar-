import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly connectedUsers = new Map<string, { userId: string; companyId: string }>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      const companyId = client.handshake.auth?.companyId || client.handshake.headers?.['x-company-id'];

      if (!token || !companyId) {
        throw new UnauthorizedException('Missing authentication');
      }

      const payload = this.jwtService.verify(token);

      // Verify user belongs to company
      const membership = await this.prisma.companyUser.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: payload.sub,
          },
        },
      });

      if (!membership || !membership.isActive) {
        throw new UnauthorizedException('Not a member of this company');
      }

      // Store connection info
      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        companyId,
      });

      // Join company room (tenant isolation for events)
      await client.join(`company:${companyId}`);

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.sub}, company: ${companyId})`,
      );

      // Notify room of new user
      this.server.to(`company:${companyId}`).emit('user:joined', {
        userId: payload.sub,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      this.server.to(`company:${userInfo.companyId}`).emit('user:left', {
        userId: userInfo.userId,
        timestamp: new Date().toISOString(),
      });
      this.connectedUsers.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('journal:subscribe')
  handleJournalSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { entryId: string },
  ) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo) return;

    client.join(`journal:${data.entryId}`);
    return { event: 'journal:subscribed', data: { entryId: data.entryId } };
  }

  @SubscribeMessage('invoice:subscribe')
  handleInvoiceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { invoiceId: string },
  ) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo) return;

    client.join(`invoice:${data.invoiceId}`);
    return { event: 'invoice:subscribed', data: { invoiceId: data.invoiceId } };
  }

  /**
   * Emit event to a company room - used by other services.
   * Ensures strict tenant isolation: events only go to the right company.
   */
  emitToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
