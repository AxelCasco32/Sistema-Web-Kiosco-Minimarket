// utils/enviarEmail.js
// Envío de correos por SMTP (nodemailer). La configuración sale del .env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Si SMTP_HOST no está configurado, el correo NO se envía: se muestra en la
// consola del backend para poder probar en desarrollo sin cuenta de correo.
const nodemailer = require('nodemailer');

let transporter = null;

function smtpConfigurado() {
  return Boolean((process.env.SMTP_HOST || '').trim());
}

function obtenerTransporter() {
  if (!transporter) {
    const puerto = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port: puerto,
      secure: puerto === 465, // 465 = SSL directo; 587 = STARTTLS
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

// Devuelve true si el correo se envió, false si no hay SMTP configurado
// (en ese caso solo se muestra en la consola). Si el servidor de correo
// falla, lanza el error.
async function enviarEmail({ para, asunto, texto, html, adjuntos, responderA }) {
  if (!smtpConfigurado()) {
    console.warn(
      `\n[EMAIL NO ENVIADO - falta SMTP_HOST en el .env]\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n`
    );
    return false;
  }

  await obtenerTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    replyTo: responderA,
    subject: asunto,
    text: texto,
    html,
    attachments: adjuntos,
  });
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
