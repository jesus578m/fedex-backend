// Vercel Serverless Function: /api/track
// Llama a OAuth de FedEx y luego a Track API (hasta 30 guias)
// Devuelve JSON simplificado para tu tabla

const FEDEX_OAUTH = "https://apis.fedex.com/oauth/token";           // Prod OAuth
const FEDEX_TRACK = "https://apis.fedex.com/track/v1/trackingnumbers"; // Track v1

const ALLOW_ORIGIN = "*"; // update to actual domain if necessary

function sendCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function bad(res, code, msg, extra) {
  return res.status(code).json({ error: msg, ...(extra ? { detail: extra } : {}) });
}

function normalizeFedEx(data) {
  const out = [];
  const list =
    data?.output?.completeTrackResults ??
    data?.output?.trackResults ??
    data?.completeTrackResults ??
    data?.trackResults ??
    [];
  const flat = [];
  for (const item of list) {
    if (item?.trackResults && Array.isArray(item.trackResults)) {
      flat.push(...item.trackResults);
    } else {
      flat.push(item);
    }
  }
  for (const it of flat) {
    const tn =
      it?.trackingNumber ||
      it?.trackingNumberInfo?.trackingNumber ||
      it?.masterTrackingNumber ||
      "";
    const last =
      (it?.scanEvents && it.scanEvents[0]) ||
      it?.latestStatusDetail ||
      {};
    const status =
      last?.eventDescription ||
      last?.statusByLocale ||
      it?.latestStatus ||
      it?.latestStatusDetail?.statusByLocale ||
      "";
    const ts = last?.dateAndTime || it?.dateAndTime || "";
    const loc =
      last?.scanLocation?.city ||
      last?.scanLocation ||
      it?.scanLocation?.city ||
      "";
    const service =
      it?.serviceDetail?.type ||
      it?.serviceType ||
      it?.serviceDescription ||
      "";
    const delivered =
      String(status).toLowerCase().includes("entregado") ||
      String(status).toLowerCase().includes("delivered");
    out.push({
      trackingNumber: tn,
      ok: true,
      lastStatus: status || "",
      lastUpdateLocal: ts || "",
      location: loc || "",
      delivered,
      service
    });
  }
  return out;
}
https://github.com/jesus578m/fedex-tracker
