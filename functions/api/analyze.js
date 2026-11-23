import { CATALOGO_YCR } from "./catalog.js";

const MODEL = "gemini-3.8-flash";

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
          nivel: {
            type: "STRING",
            enum: ["leve", "moderado", "marcado"]
          },
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
          rol: {
            type: "STRING",
            enum: ["principal", "complementario"]
          },
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
    rutina_manana: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    rutina_noche: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  }
};

const AREAS_VALIDAS = new Set([
  "Manchas",
  "Arrugas y líneas",
  "Poros",
  "Flacidez",
  "Piel opaca",
  "Deshidratación",
  "Ojeras",
  "Acné / granitos",
  "Rojeces"
]);

function normalizarAreas(body) {
  const recibidas = Array.isArray(body?.areas_interes)
    ? body.areas_interes
    : typeof body?.contexto === "string"
      ? body.contexto.split(",")
      : [];

  return [...new Set(
    recibidas
      .filter(x => typeof x === "string")
      .map(x => x.trim())
      .filter(x => AREAS_VALIDAS.has(x))
  )];
}

function buildSystemPrompt(areasInteres = []) {
  const objetivos = areasInteres.length
    ? areasInteres.join(", ")
    : "No indicó áreas específicas";

  return `Sos la asistente cosmética de ${CATALOGO_YCR.config.marca} (${CATALOGO_YCR.config.nombre_completo}), en Argentina.
Hablá siempre en español rioplatense, con voseo cálido, claro, profesional y empático.

Realizá una lectura cosmética orientativa usando exclusivamente la foto o descripción recibida en esta solicitud.
La persona indicó que le gustaría mejorar: ${objetivos}.

Personalización obligatoria:
- Analizá esta imagen en particular. No uses respuestas de demostración ni copies automáticamente informes o rutinas anteriores.
- Cada observación debe apoyarse en un rasgo visible en esta foto. Si no distinguís algo con claridad, indicá la limitación o no lo incluyas.
- Las áreas seleccionadas son intereses de la persona, no evidencia de que esas condiciones estén presentes. Priorizalas solo si encontrás señales visibles compatibles.
- Adaptá el resumen, las observaciones, el plan, los tratamientos y la rutina a los rasgos observables y a las áreas seleccionadas. Evitá afirmar características que no se puedan apreciar.
- No repitas automáticamente la misma combinación de productos o tratamientos. Elegí del catálogo lo que mejor corresponda a esta lectura; si la evidencia no permite diferenciar, sé prudente y explicalo.
- Una foto no permite confirmar por sí sola el tipo de piel, la hidratación ni un diagnóstico. Presentá esas valoraciones como orientativas, no como certezas.

Reglas:
1. Si recibís una foto y no se ve un rostro humano con suficiente claridad (oscura, borrosa, objeto, filtro excesivo o maquillaje pesado que impide ver la piel), devolvé "foto_valida": false y explicá brevemente qué mejorar en "motivo_foto_invalida". En modo texto, devolvé "foto_valida": true.
2. Nunca hagas diagnósticos médicos ni recetes medicamentos. Si observás signos que ameriten una evaluación profesional, sugerí consulta dermatológica en "consulta_medica"; si no, usá null.
3. Recomendá entre 2 y 3 tratamientos eligiendo únicamente de esta lista. Indicá uno como "principal" y el resto como "complementario":
${CATALOGO_YCR.tratamientos.map(t => `- ${t}`).join("\n")}
4. Opcionalmente sugerí una opción intensiva en "opcion_premium" elegida de esta lista:
${CATALOGO_YCR.tratamientos_premium.map(t => `- ${t}`).join("\n")}
5. Recomendá entre 3 y 4 productos para la rutina en casa, elegidos únicamente de esta lista y adecuados a lo observado:
${CATALOGO_YCR.productos.map(p => `- ${p}`).join("\n")}
6. Destacá 2 o 3 fortalezas solo cuando sean razonablemente apreciables en la foto o descripción.`;
}

function respuestaError(mensaje, status) {
  return Response.json({ detail: mensaje }, { status });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body?.consentimiento) {
      return respuestaError(
        "Necesitamos tu aceptación para analizar tu piel.",
        400
      );
    }

    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Falta configurar el secreto GEMINI_API_KEY en Cloudflare.");

      return respuestaError(
        "El análisis con IA todavía no está configurado. Revisá la clave de Gemini en Cloudflare.",
        503
      );
    }

    const areasInteres = normalizarAreas(body);
    const parts = [];

    if (typeof body.image_base64 === "string" && body.image_base64.length > 0) {
      const mimeType = ["image/jpeg", "image/png", "image/webp"].includes(
        body.media_type
      )
        ? body.media_type
        : "image/jpeg";

      parts.push({
        inlineData: {
          mimeType,
          data: body.image_base64.replace(
            /^data:image\/[^;]+;base64,/,
            ""
          )
        }
      });

      parts.push({
        text: "Analizá esta foto del rostro para realizar una lectura cosmética orientativa y personalizada. Describí solo lo que puedas observar en esta imagen."
      });
    } else if (
      typeof body.descripcion === "string" &&
      body.descripcion.trim().length >= 15
    ) {
      parts.push({
        text: `La persona prefirió no subir una foto y describió su piel así: "${body.descripcion.trim().slice(0, 2000)}". Armá una lectura cosmética orientativa personalizada basada únicamente en esta descripción. No inventes observaciones visuales.`
      });
    } else {
      return respuestaError(
        "Falta una imagen válida o una descripción de tu piel.",
        400
      );
    }

    if (areasInteres.length) {
      parts.push({
        text: `Áreas que la persona eligió como prioridad: ${areasInteres.join(", ")}. Consideralas como sus intereses, no como hallazgos confirmados.`
      });
    }

    const model = env.GEMINI_MODEL || MODEL;
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(areasInteres) }]
        },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        "Gemini API error:",
        res.status,
        errorText.slice(0, 1500)
      );

      return respuestaError(
        "Gemini no pudo completar el análisis. Revisá la clave, el modelo configurado y los registros de Cloudflare.",
        502
      );
    }

    const data = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts
      ?.find(part => typeof part.text === "string")?.text;

    if (!rawJson) {
      console.error(
        "Gemini no devolvió texto JSON:",
        JSON.stringify(data).slice(0, 1500)
      );

      return respuestaError(
        "No pudimos interpretar la respuesta del análisis. Probá con otra foto.",
        502
      );
    }

    try {
      return Response.json(JSON.parse(rawJson));
    } catch (parseError) {
      console.error(
        "No se pudo interpretar el JSON de Gemini:",
        parseError
      );

      return respuestaError(
        "Gemini devolvió una respuesta que no pudimos interpretar. Probá de nuevo.",
        502
      );
    }
  } catch (err) {
    console.error("Analyze error:", err);

    return respuestaError(
      "Ocurrió un error al procesar tu solicitud. Probá de nuevo.",
      500
    );
  }
}
