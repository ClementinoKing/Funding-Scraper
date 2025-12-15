import { ai_provider, openai_key, groq_key, supabase } from "./config.mjs";
import { fetchPageText } from "./utils.mjs";
import { fetchAiResponse } from "./ai.mjs";
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { writeJson } from '../scrape/utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


async function transform () {
    let { data: programs_staging, error } = await supabase
        .from("programs_staging")
        .select("*");

    if (error) {
        console.error("Error fetching data from Supabase:", error);
        return;
    }

    for(const program of programs_staging) {
        let htmlContent = "No website content provided.";

        try {
            htmlContent = await fetchPageText(program.source);
        } catch (error) {
            console.error(`Error fetching page text for URL ${program.source}:`, error);
        }

        const response = await fetchAiResponse(program, openai_key, ai_provider, htmlContent);
        const ai_response = JSON.parse(response);
        ai_response['staging_id'] = program.id;
        ai_response['page_fetched'] = htmlContent !== "No website content provided.";

        const { data } = await supabase
            .from("programs")
            .insert([ai_response])
            .select();
        console.log(data)
        console.log("\n\n\n")
    }
}

transform();