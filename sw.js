/**
 * ============================================================
 * Service Worker — بوابتي (GSM Gate Opener)
 * ============================================================
 * يتحكم في التخزين المؤقت (Cache) ليتيح عمل التطبيق بدون إنترنت.
 * الاستراتيجية: Cache-First مع شبكة احتياطية.
 * ============================================================
 */

/* ============================================================
   ثوابت الإصدار والتخزين المؤقت
============================================================ */

/** اسم ذاكرة التخزين المؤقت — غيّر الرقم عند تحديث الملفات */
const CACHE_NAME = "gsm-gate-v1.0.0";

/**
 * الموارد التي تُخزَّن عند تثبيت Service Worker (Pre-Cache)
 * تشمل كل ما يحتاجه التطبيق للعمل أوفلاين.
 */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  /* خط Tajawal من Google Fonts — سيُخزَّن عند أول تحميل */
];

/* ============================================================
   حدث: تثبيت Service Worker (Install)
============================================================ */
self.addEventListener("install", (event) => {
  console.log("[SW] جاري التثبيت...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] تخزين الملفات الأساسية مسبقاً...");
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log("[SW] اكتمل التثبيت — تخطي الانتظار");
        // تفعيل Service Worker الجديد فوراً بدون انتظار إغلاق التبويبات
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] خطأ أثناء التثبيت:", err);
      })
  );
});

/* ============================================================
   حدث: تفعيل Service Worker (Activate)
============================================================ */
self.addEventListener("activate", (event) => {
  console.log("[SW] جاري التفعيل...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // حذف كل ذاكرات التخزين القديمة التي لا تتطابق مع الإصدار الحالي
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((oldCache) => {
              console.log("[SW] حذف ذاكرة تخزين قديمة:", oldCache);
              return caches.delete(oldCache);
            })
        );
      })
      .then(() => {
        console.log("[SW] تم التفعيل — السيطرة على جميع التبويبات");
        // السيطرة على جميع الصفحات المفتوحة فوراً
        return self.clients.claim();
      })
  );
});

/* ============================================================
   حدث: اعتراض الطلبات (Fetch)
   الاستراتيجية: Cache-First → Network Fallback
============================================================ */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  /* --- تجاهل الطلبات غير HTTP (مثل: chrome-extension://) --- */
  if (!event.request.url.startsWith("http")) return;

  /* --- تجاهل طلبات POST وغيرها غير GET --- */
  if (event.request.method !== "GET") return;

  /* --- تجاهل طلبات Analytics والخدمات الخارجية --- */
  if (
    url.hostname.includes("google-analytics.com") ||
    url.hostname.includes("googletagmanager.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      /* إذا وُجد في الكاش — أعده فوراً (Cache-First) */
      if (cachedResponse) {
        console.log("[SW] من الكاش:", event.request.url);
        return cachedResponse;
      }

      /* إذا لم يوجد — اطلبه من الشبكة ثم خزّنه */
      return fetch(event.request)
        .then((networkResponse) => {
          /* التحقق من صحة الاستجابة قبل التخزين */
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "error"
          ) {
            return networkResponse;
          }

          /* نسخ الاستجابة لأنها تُقرأ مرة واحدة فقط */
          const cloned = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
            console.log("[SW] تم تخزين:", event.request.url);
          });

          return networkResponse;
        })
        .catch(() => {
          /*
           * الشبكة غير متاحة والملف غير موجود في الكاش.
           * نُعيد صفحة احتياطية أوفلاين مخصصة.
           */
          console.warn("[SW] أوفلاين — لا يوجد رد لـ:", event.request.url);

          /* إذا كان الطلب لصفحة HTML — أعد الصفحة الرئيسية من الكاش */
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }

          /* طلبات أخرى — استجابة فارغة */
          return new Response("", {
            status: 408,
            statusText: "Request Timeout (Offline)",
          });
        });
    })
  );
});

/* ============================================================
   حدث: رسائل من الصفحة الرئيسية (Message)
============================================================ */
self.addEventListener("message", (event) => {
  /* أمر تحديث الكاش يدوياً */
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] تم استقبال طلب التحديث الفوري");
    self.skipWaiting();
  }

  /* أمر مسح الكاش */
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.delete(CACHE_NAME).then(() => {
      console.log("[SW] تم مسح الكاش");
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

/* ============================================================
   حدث: الإشعارات الدفعية (Push Notifications) — للمستقبل
============================================================ */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body:    data.body    || "رسالة جديدة من بوابتي",
    icon:    data.icon    || "/icons/icon-192.png",
    badge:   data.badge   || "/icons/icon-72.png",
    vibrate: [200, 100, 200],
    dir:     "rtl",
    lang:    "ar",
    tag:     "gsm-gate-notification",
    data:    { url: data.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "بوابتي",
      options
    )
  );
});

/* ============================================================
   حدث: النقر على الإشعار
============================================================ */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      /* إذا كان التطبيق مفتوحاً — أحضره للأمام */
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      /* إذا لم يكن مفتوحاً — افتح نافذة جديدة */
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || "/");
      }
    })
  );
});
