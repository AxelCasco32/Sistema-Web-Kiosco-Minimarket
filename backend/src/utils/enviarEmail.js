// utils/enviarEmail.js
// Envío de correos. Hay dos formas, según las variables del .env / Render:
//
// 1) API de Brevo (recomendada en Render): BREVO_API_KEY + SMTP_FROM.
//    Envía por HTTPS, que no está bloqueado. El remitente de SMTP_FROM tiene
//    que estar verificado en Brevo (Senders & IP > Senders).
// 2) SMTP (por ejemplo Gmail): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
//    SMTP_FROM. Funciona en la PC; el plan gratuito de Render puede bloquear
//    los puertos de correo (25/465/587).
//
// Si no hay ninguna configurada, el correo NO se envía: se muestra en la
// consola del backend para poder probar en desarrollo.
const nodemailer = require('nodemailer');

const TIEMPO_LIMITE_MS = 10000; // 10 s: si el servidor no responde, se informa el error
let transporter = null;

const limpio = (v) => String(v || '').trim().replace(/^"(.*)"$/, '$1').trim();

function brevoConfigurado() {
  return Boolean(limpio(process.env.BREVO_API_KEY));
}

function smtpConfigurado() {
  return brevoConfigurado() || Boolean(limpio(process.env.SMTP_HOST));
}

// "KiosquitoYa <cuenta@gmail.com>" -> { nombre: 'KiosquitoYa', email: 'cuenta@gmail.com' }
function remitente() {
  const valor = limpio(process.env.SMTP_FROM) || limpio(process.env.SMTP_USER);
  const m = valor.match(/^(.*)<([^>]+)>$/);
  return m
    ? { nombre: m[1].trim().replace(/^"|"$/g, '') || 'KiosquitoYa', email: m[2].trim() }
    : { nombre: 'KiosquitoYa', email: valor };
}

function obtenerTransporter() {
  if (!transporter) {
    const puerto = Number(limpio(process.env.SMTP_PORT)) || 465;
    transporter = nodemailer.createTransport({
      host: limpio(process.env.SMTP_HOST),
      port: puerto,
      secure: puerto === 465, // 465 = SSL directo; 587 = STARTTLS
      auth: limpio(process.env.SMTP_USER)
        ? { user: limpio(process.env.SMTP_USER), pass: limpio(process.env.SMTP_PASS) }
        : undefined,
      connectionTimeout: TIEMPO_LIMITE_MS,
      greetingTimeout: TIEMPO_LIMITE_MS,
      socketTimeout: TIEMPO_LIMITE_MS * 2,
    });
  }
  return transporter;
}

// Traduce los errores más comunes a un motivo entendible para el log
function explicarError(error) {
  const codigo = error.code || error.responseCode || '';
  if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED'].includes(codigo) || /timeout/i.test(error.message)) {
    return `no se pudo conectar al servidor de correo (${codigo || 'timeout'}). Si el backend está en Render gratis, ` +
      'los puertos SMTP están bloqueados: configurá BREVO_API_KEY.';
  }
  if (codigo === 'EAUTH' || error.responseCode === 535) {
    return 'usuario o contraseña de correo incorrectos (EAUTH). Con Gmail hay que usar una contraseña de aplicación.';
  }
  return `${codigo ? codigo + ': ' : ''}${error.message}`;
}

async function enviarPorBrevo({ para, asunto, texto, html, adjuntos, responderA }) {
  const desde = remitente();
  const cuerpo = {
    sender: { name: desde.nombre, email: desde.email },
    to: [{ email: para }],
    subject: asunto,
    htmlContent: html || `<pre>${texto}</pre>`,
    textContent: texto,
  };
  if (responderA) cuerpo.replyTo = { email: responderA };
  if (adjuntos && adjuntos.length) {
    cuerpo.attachment = adjuntos.map((a) => ({
      name: a.filename,
      content: Buffer.from(a.content).toString('base64'),
    }));
  }

  const controlador = new AbortController();
  const corte = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  let respuesta;
  try {
    respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': limpio(process.env.BREVO_API_KEY),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(corte);
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    const error = new Error(`Brevo respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
    error.code = `BREVO_${respuesta.status}`;
    throw error;
  }
}

// Devuelve true si el correo se envió, false si no hay correo configurado
// (en ese caso solo se muestra en la consola). Si el envío falla, lanza un
// error con un mensaje que explica el motivo.
async function enviarEmail({ para, asunto, texto, html, adjuntos, responderA }) {
  if (!smtpConfigurado()) {
    console.warn(
      `\n[EMAIL NO ENVIADO - falta BREVO_API_KEY o SMTP_HOST]\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n`
    );
    return false;
  }

  try {
    if (brevoConfigurado()) {
      await enviarPorBrevo({ para, asunto, texto, html, adjuntos, responderA });
    } else {
      const desde = remitente();
      await obtenerTransporter().sendMail({
        from: { name: desde.nombre, address: desde.email },
        to: para,
        replyTo: responderA,
        subject: asunto,
        text: texto,
        html,
        attachments: adjuntos,
      });
    }
  } catch (error) {
    const motivo = explicarError(error);
    console.error(`[EMAIL] Falló el envío a ${para} por ${brevoConfigurado() ? 'Brevo' : 'SMTP'}: ${motivo}`);
    error.message = motivo;
    throw error;
  }
  return true;
}

function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function emailCodigoRecuperacion({ nombre, usuario, codigo, minutos }) {
  const asunto = `Tu código para recuperar la contraseña: ${codigo}`;
  const texto =
    `Hola ${nombre},\n\n` +
    `Pediste restablecer la contraseña del usuario "${usuario}" en KiosquitoYa.\n\n` +
    `Tu código es: ${codigo}\n\n` +
    `Vence en ${minutos} minutos y sirve una sola vez.\n` +
    `Si no fuiste vos, ignorá este correo: tu contraseña no cambia.\n`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
      <h2 style="color:#261d60;margin-bottom:8px">Recuperar contraseña</h2>
      <p>Hola ${escaparHtml(nombre)},</p>
      <p>Pediste restablecer la contraseña del usuario <strong>${escaparHtml(usuario)}</strong> en KiosquitoYa.</p>
      <p style="margin:24px 0;text-align:center">
        <span style="display:inline-block;font-size:30px;font-weight:bold;letter-spacing:8px;color:#261d60;background:#f0edfd;padding:14px 22px;border-radius:10px">${codigo}</span>
      </p>
      <p>Vence en <strong>${minutos} minutos</strong> y sirve una sola vez.</p>
      <p style="color:#64748b;font-size:13px">Si no fuiste vos, ignorá este correo: tu contraseña no cambia.</p>
    </div>`;
  return { asunto, texto, html };
}

module.exports = { enviarEmail, emailCodigoRecuperacion, smtpConfigurado, escaparHtml };
