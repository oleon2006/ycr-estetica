import { CATALOGO_YCR } from "./catalog.js";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "foto_valida",
    "motivo_foto_invalida",
    "tipo_piel",
    "tema_principal",
    "resumen",
    "fortalezas",
    "observaciones",
    "tratamientos",
    "plan",
    "productos",
    "rutina_manana",
    "rutina_noche"
  ],
  properties: {
    foto_valida: { type: "BOOLEAN" },
    motivo_foto_invalida: { type: "STRING" },
    tipo_piel: { type: "STRING" },
    tema_principal: { type: "STRING" },
    resumen: { type: "STRING" },
    fortalezas: { type: "ARRAY", items: { type: "STRING" } },
    consulta_medica: { type: "STRING", nullable: true },
    observaciones: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["titulo", "nivel", "detalle"],
        properties: {
          titulo: { type: "STRING" },
          nivel: { type: "STRING", enum: ["leve", "moderado", "marcado"] },
          detalle: { type: "STRING" }
        }
      }
    },
    tratamientos: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["nombre", "rol", "frecuencia", "por_que"],
        properties: {
          nombre: { type: "STRING" },
          rol: { type: "STRING", enum: ["principal", "complementario"] },
          frecuencia: { type: "STRING" },
          por_que: { type: "STRING" }
        }
      }
    },
    plan: { type: "STRING" },
    opcion_premium: {
      type: "OBJECT",
      nullable: true,
      required: ["nombre", "frecuencia", "por_que"],
      properties: {
        nombre: { type: "STRING" },
        frecuencia: { type: "STRING" },
        por_que: { type: "STRING" }
      }
    },
    productos: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["nombre", "uso", "por_que"],
        properties: {
          nombre: { type: "STRING" },
          uso: { type: "STRING" },
          por_que: { type: "STRING" }
        }
      }
    },
    rutina_manana: { type: "ARRAY", items: { type: "STRING" } },
    rutina_noche: { type: "ARRAY", items: { type: "STRING" } }
  }
};

function buildSystemPrompt() {
  return `Sos la asistente cosmética de ${CATALOGO_YCR.config.marca} (${CATALOGO_YCR.config.nombre_completo}), en Argentina.
Hablá siempre en español rioplatense (voseo cálido, claro, profesional y empático).

Tu tarea es realizar una lectura cosmética y orientativa de la piel (a partir de una foto o una descripción) y recomendar tratamientos del catálogo de YCR Estética.

Reglas estrictas:
1. Si recibís una foto y NO se ve un rostro humano con suficiente claridad (oscura, borrosa, objeto, filtro excesivo o maquillaje pesado que impide ver la piel), devolvé "foto_valida": false y explicá brevemente qué mejorar en "motivo_foto_invalida". En modo texto, devolvé siempre "foto_valida": true.
2. Nunca hagas diagnósticos médicos ni recetes medicamentos. Si notás signos compatibles con acné severo, lesiones sospechosas o rosácea inflamatoria marcada, sugerí consulta dermatológica en "consulta_medica"; si no hace falta, dejalo en null.
3. Recomendá entre 2 y 3 tratamientos eligiendo ÚNICAMENTE de esta lista (uno con rol "principal" y el resto "complementario"):
${CATALOGO_YCR.tratamientos.map(t => `- ${t}`).join("\n")}
4. Opcionalmente sugerí 1 opción intensiva en "opcion_premium" elegida de:
${CATALOGO_YCR.tratamientos_premium.map(t => `- ${t}`).join("\n")}
5. Recomendá entre 3 y 4 productos para rutina en casa eligiendo de:
${CATALOGO_YCR.productos.map(p => `- ${p}`).join("\n")}
6. Destacá siempre 2 o 3 aspectos positivos en "fortalezas".`;
}

function demoResponse() {
  return {
    modo_demo: true,
    foto_valida: true,
    motivo_foto_invalida: "",
    tipo_piel: "Mixta con signos leves de deshidratación",
    tema_principal: "poros dilatados en zona T y falta de luminosidad",
    resumen: "Tu piel tiene una buena base y tono parejo, pero se beneficia mucho de una renovación suave y un refuerzo de hidratación para recuperar brillo natural.",
    fortalezas: ["Buena elasticidad general", "Tono base bastante uniforme"],
    consulta_medica: null,
    observaciones: [
      { titulo: "Textura y poros", nivel: "moderado", detalle: "Se perciben poros algo más visibles en la zona central (frente y nariz)." },
      { titulo: "Hidratación", nivel: "leve", detalle: "Leve opacidad superficial compatible con falta de agua en la epidermis." }
    ],
    tratamientos: [
      {
        nombre: "Limpieza Facial Profunda con extracciones y mascarilla personalizada",
        rol: "principal",
        frecuencia: "1 sesión inicial y luego cada 30 días",
        por_que: "Descongestiona poros, elimina células muertas y prepara la piel para absorber mejor los activos."
      },
      {
        nombre: "Shock de Hidratación y Luminosidad (Vitamina C + Ácido Hialurónico)",
        rol: "complementario",
        frecuencia: "Cada 21 a 30 días",
        por_que: "Devuelve frescura inmediata y mejora el aspecto apagado."
      }
    ],
    plan: "Empezamos con una limpieza profunda para equilibrar la piel y, a los 15 días, sumamos el shock de luminosidad para potenciar el resultado.",
    opcion_premium: {
      nombre: "Protocolo Combinado Renovación Total (Peeling + Dermapen + LED)",
      frecuencia: "1 vez al mes (plan de 3 sesiones)",
      por_que: "Ideal si buscás afinar la textura de forma más intensiva y duradera."
    },
    productos: [
      { nombre: "Gel o espuma de limpieza suave", uso: "Mañana y noche", por_que: "Limpia sin resecar ni alterar la barrera cutánea." },
      { nombre: "Sérum de Niacinamida (poros, sebo y tono uniforme)", uso: "Mañana o noche", por_que: "Ayuda a minimizar la apariencia de poros y equilibrar el brillo." },
      { nombre: "Protector solar FPS 50+ toque seco", uso: "Todas las mañanas", por_que: "Protege del fotoenvejecimiento sin dejar sensación pesada." }
    ],
    rutina_manana: ["Limpieza suave", "Sérum de Niacinamida", "Protector solar FPS 50+"],
    rutina_noche: ["Limpieza suave", "Crema hidratante reparadora"]
  };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body?.consentimiento) {
      return Response.json(
        { detail: "Necesitamos tu aceptación para analizar tu piel." },
        { status: 400 }
      );
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(demoResponse());
    }

    const parts = [];
    if (body.image_base64) {
      parts.push({
        inlineData: {
          mimeType: body.media_type || "image/jpeg",
          data: body.image_base64
        }
      });
      parts.push({
        text: body.contexto
          ? `Analizá esta foto del rostro. La persona indicó que le gustaría mejorar: ${body.contexto}.`
          : "Analizá esta foto del rostro y armá la lectura de piel personalizada."
      });
    } else if (body.descripcion) {
      parts.push({
        text: `La persona prefirió no subir foto y describió su piel así: "${body.descripcion}". Armá la lectura de piel y recomendaciones.`
      });
    } else {
      return Response.json(
        { detail: "Falta la imagen o la descripción de tu piel." },
        { status: 400 }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText);
      return Response.json(
        { detail: "El servicio de análisis no respondió en este momento. Probá de nuevo en unos segundos." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      return Response.json(
        { detail: "No pudimos interpretar la respuesta del análisis. Probá con otra foto." },
        { status: 502 }
      );
    }

    return Response.json(JSON.parse(rawJson));
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json(
      { detail: "Ocurrió un error al procesar tu solicitud. Probá de nuevo." },
      { status: 500 }
    );
  }
}
