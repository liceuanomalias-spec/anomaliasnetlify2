// Netlify Function v2 API
// Single file with internal routing - replaces all FastAPI endpoints.
// Route automatically: any request matching /api/* hits this function.

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";

// ---------- Env ----------
const env = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var: ${key}`);
  }
  return v;
};

const MONGO_URL = env("MONGO_URL");
const DB_NAME = env("DB_NAME", "aelc_anomalias");
const SMTP_HOST = env("SMTP_HOST", "smtp.gmail.com");
const SMTP_PORT = parseInt(env("SMTP_PORT", "587"), 10);
const SMTP_USER = env("SMTP_USER");
const SMTP_PASSWORD = env("SMTP_PASSWORD").replace(/\s+/g, "");
const EMAIL_SENDER_NAME = env("EMAIL_SENDER_NAME", "Escola Secundária de Latino Coelho");
const DEFAULT_RECIPIENT = env("DEFAULT_RECIPIENT", "nuno.ribeiro@aelc-lamego.pt");
const JWT_SECRET = env("JWT_SECRET");
const JWT_EXPIRATION_HOURS = parseInt(env("JWT_EXPIRATION_HOURS", "168"), 10);
const ADMIN_USERNAME = env("ADMIN_USERNAME", "admin");
const ADMIN_PASSWORD = env("ADMIN_PASSWORD");
const ALLOWED_DOMAIN = env("ALLOWED_DOMAIN", "aelc-lamego.pt");

// ---------- Mongo (cached across invocations) ----------
let cachedClient = null;
let seeded = false;

async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL, { maxPoolSize: 5 });
    await cachedClient.connect();
  }
  const db = cachedClient.db(DB_NAME);
  if (!seeded) {
    const existing = await db.collection("recipients").findOne({ email: DEFAULT_RECIPIENT.toLowerCase() });
    if (!existing) {
      await db.collection("recipients").insertOne({
        id: randomUUID(),
        email: DEFAULT_RECIPIENT.toLowerCase(),
        active: true,
        created_at: new Date().toISOString(),
      });
    }
    seeded = true;
  }
  return db;
}

// ---------- Helpers ----------
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const error = (status, detail) => json(status, { detail });

const createToken = (sub, role, extra = {}) =>
  jwt.sign({ sub, role, ...extra }, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRATION_HOURS}h`,
  });

const decodeToken = (req) => {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
};

async function requireUser(req) {
  const payload = decodeToken(req);
  if (!payload || payload.role !== "user") return null;
  const db = await getDb();
  const user = await db.collection("users").findOne(
    { id: payload.sub },
    { projection: { _id: 0, password: 0 } },
  );
  return user || null;
}

function requireAdmin(req) {
  const payload = decodeToken(req);
  if (!payload || payload.role !== "admin") return null;
  return { username: payload.sub, role: "admin" };
}

// ---------- Email ----------
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

function buildEmailHtml(report, userEmail) {
  const nome = report.nome || "—";
  const tipo = (report.tipo || "").charAt(0).toUpperCase() + (report.tipo || "").slice(1);
  const sala = report.sala || "—";
  const info = report.info_adicional || "—";
  return `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
<tr><td style="padding:20px 24px;background:#166534;color:#fff;">
<h1 style="margin:0;font-size:18px;">Novo Relato de Anomalia</h1>
<p style="margin:4px 0 0;font-size:12px;opacity:.85;">Escola Secundária de Latino Coelho</p>
</td></tr>
<tr><td style="padding:24px;">
<p style="margin:0 0 8px;"><strong>Nome:</strong> ${nome}</p>
<p style="margin:0 0 8px;"><strong>Perfil:</strong> ${tipo || "—"}</p>
<p style="margin:0 0 16px;font-size:13px;color:#6B7280;"><strong>Conta:</strong> ${userEmail}</p>
<p style="margin:0 0 16px;font-size:12px;color:#6B7280;"><strong>Data:</strong> ${report.created_at}</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;"/>
<p style="margin:0 0 8px;"><strong>Local da Anomalia:</strong><br/>${report.local}</p>
<p style="margin:12px 0 8px;"><strong>Número da Sala:</strong><br/>${sala}</p>
<p style="margin:12px 0 8px;"><strong>Descrição do Problema:</strong><br/>${report.descricao}</p>
<p style="margin:12px 0 8px;"><strong>Informações Adicionais:</strong><br/>${info}</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#F9FAFB;color:#6B7280;font-size:11px;">
Mensagem gerada automaticamente pela aplicação de relato de anomalias.
</td></tr>
</table></body></html>`;
}

async function sendEmail(subject, html, recipients) {
  if (!recipients.length) return { success: false, error: "Sem destinatários" };
  try {
    await getTransporter().sendMail({
      from: `"${EMAIL_SENDER_NAME}" <${SMTP_USER}>`,
      to: recipients.join(", "),
      subject,
      html,
    });
    return { success: true };
  } catch (e) {
    console.error("SMTP error:", e);
    return { success: false, error: String(e?.message || e) };
  }
}

// ---------- Validators ----------
const isInstitutional = (email) =>
  typeof email === "string" && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

const required = (v) => typeof v === "string" && v.trim().length > 0;

// ---------- Routes ----------
async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

async function route(req, path) {
  const method = req.method;

  // Root
  if (path === "/" || path === "") {
    return json(200, {
      message: "Escola Secundária de Latino Coelho - Reporte de Anomalias API",
      domain: ALLOWED_DOMAIN,
    });
  }

  // --- Auth ---
  if (path === "/auth/register" && method === "POST") {
    const body = await readBody(req);
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    if (!isInstitutional(email)) return error(400, `O email deve ser do domínio @${ALLOWED_DOMAIN}`);
    if (password.length < 6) return error(400, "A palavra-passe deve ter pelo menos 6 caracteres");
    const db = await getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) return error(400, "Este email já está registado");
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      id, email, password: hash, user_type: null,
      created_at: new Date().toISOString(),
    });
    const token = createToken(id, "user", { email });
    return json(200, { token, user: { id, email, user_type: null } });
  }

  if (path === "/auth/login" && method === "POST") {
    const body = await readBody(req);
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return error(401, "Credenciais inválidas");
    }
    if (!isInstitutional(email)) return error(403, `Apenas emails @${ALLOWED_DOMAIN}`);
    const token = createToken(user.id, "user", { email: user.email });
    return json(200, {
      token,
      user: { id: user.id, email: user.email, user_type: user.user_type || null },
    });
  }

  if (path === "/auth/admin-login" && method === "POST") {
    const body = await readBody(req);
    if (body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
      return error(401, "Credenciais de administrador inválidas");
    }
    const token = createToken(ADMIN_USERNAME, "admin");
    return json(200, { token, admin: { username: ADMIN_USERNAME } });
  }

  if (path === "/auth/me" && method === "GET") {
    const user = await requireUser(req);
    if (!user) return error(401, "Não autenticado");
    return json(200, { user });
  }

  // --- User ---
  if (path === "/user/type" && method === "POST") {
    const user = await requireUser(req);
    if (!user) return error(401, "Não autenticado");
    const body = await readBody(req);
    if (!["aluno", "professor"].includes(body.user_type)) return error(400, "Perfil inválido");
    const db = await getDb();
    await db.collection("users").updateOne(
      { id: user.id },
      { $set: { user_type: body.user_type } },
    );
    return json(200, { user_type: body.user_type });
  }

  // --- Reports ---
  if (path === "/reports" && method === "POST") {
    const user = await requireUser(req);
    if (!user) return error(401, "Não autenticado");
    const body = await readBody(req);
    if (!required(body.nome)) return error(422, "Nome é obrigatório");
    if (!["aluno", "professor"].includes(body.tipo)) return error(422, "Perfil inválido");
    if (!required(body.local)) return error(422, "Local é obrigatório");
    if (!required(body.descricao)) return error(422, "Descrição é obrigatória");

    const db = await getDb();
    const reportId = randomUUID();
    const now = new Date().toISOString();
    const report = {
      id: reportId,
      user_id: user.id,
      user_email: user.email,
      user_type: user.user_type,
      nome: body.nome.trim(),
      tipo: body.tipo,
      local: body.local.trim(),
      sala: body.sala?.trim() || null,
      descricao: body.descricao.trim(),
      info_adicional: body.info_adicional?.trim() || null,
      created_at: now,
      email_sent: false,
      email_error: null,
    };
    await db.collection("reports").insertOne({ ...report });

    const recipientsList = await db.collection("recipients")
      .find({ active: true }, { projection: { _id: 0, email: 1 } })
      .toArray();
    const emails = recipientsList.map((r) => r.email);

    const subject = `[Latino Coelho] Anomalia em ${report.local}`;
    const html = buildEmailHtml(report, user.email);
    const emailRes = await sendEmail(subject, html, emails);

    await db.collection("reports").updateOne(
      { id: reportId },
      {
        $set: {
          email_sent: emailRes.success,
          email_error: emailRes.success ? null : emailRes.error,
        },
      },
    );
    report.email_sent = emailRes.success;
    report.email_error = emailRes.success ? null : emailRes.error;
    return json(200, { report, email_sent: emailRes.success });
  }

  if (path === "/reports/mine" && method === "GET") {
    const user = await requireUser(req);
    if (!user) return error(401, "Não autenticado");
    const db = await getDb();
    const reports = await db.collection("reports")
      .find({ user_id: user.id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return json(200, { reports });
  }

  // --- Admin ---
  if (path === "/admin/reports" && method === "GET") {
    if (!requireAdmin(req)) return error(403, "Acesso negado");
    const db = await getDb();
    const reports = await db.collection("reports")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return json(200, { reports });
  }

  if (path === "/admin/recipients" && method === "GET") {
    if (!requireAdmin(req)) return error(403, "Acesso negado");
    const db = await getDb();
    const recipients = await db.collection("recipients")
      .find({}, { projection: { _id: 0 } })
      .toArray();
    return json(200, { recipients });
  }

  if (path === "/admin/recipients" && method === "POST") {
    if (!requireAdmin(req)) return error(403, "Acesso negado");
    const body = await readBody(req);
    const email = (body.email || "").toLowerCase().trim();
    if (!email) return error(422, "Email obrigatório");
    const db = await getDb();
    const exists = await db.collection("recipients").findOne({ email });
    if (exists) return error(400, "Este email já está na lista");
    const doc = {
      id: randomUUID(),
      email,
      active: true,
      created_at: new Date().toISOString(),
    };
    await db.collection("recipients").insertOne({ ...doc });
    return json(200, { recipient: doc });
  }

  // /admin/recipients/:id  and /admin/recipients/:id/toggle
  const recMatch = path.match(/^\/admin\/recipients\/([^/]+)(\/toggle)?$/);
  if (recMatch) {
    if (!requireAdmin(req)) return error(403, "Acesso negado");
    const id = recMatch[1];
    const isToggle = !!recMatch[2];
    const db = await getDb();
    if (method === "DELETE" && !isToggle) {
      const res = await db.collection("recipients").deleteOne({ id });
      if (!res.deletedCount) return error(404, "Destinatário não encontrado");
      return json(200, { deleted: true });
    }
    if (method === "PATCH" && isToggle) {
      const doc = await db.collection("recipients").findOne({ id });
      if (!doc) return error(404, "Destinatário não encontrado");
      const newActive = !doc.active;
      await db.collection("recipients").updateOne({ id }, { $set: { active: newActive } });
      return json(200, { id, active: newActive });
    }
  }

  return error(404, `Rota não encontrada: ${method} ${path}`);
}

// ---------- Entry ----------
export default async (req) => {
  const url = new URL(req.url);
  // Strip /api prefix from path
  let path = url.pathname.replace(/^\/api/, "");
  if (path === "") path = "/";
  try {
    return await route(req, path);
  } catch (e) {
    console.error("Function error:", e);
    return error(500, `Erro interno: ${e?.message || "unknown"}`);
  }
};

export const config = {
  path: "/api/*",
};
