import { ai_provider, openai_key, groq_key, supabase } from "./config.mjs";
import { fetchPageText, fetchPageTextWithBrowser, looksLikeLoaderPage } from "./utils.mjs";
import { fetchAiResponse } from "./ai.mjs";
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { writeJson } from '../scrape/utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


async function transform () {
    let { data: programs_staging, error } = await supabase
        .from("programs_staging")
        // .from("tmp_programs")
        .select("*");

    if (error) {
        console.error("Error fetching data from Supabase:", error);
        return;
    }

    for(const program of programs_staging) {
        let htmlContent = "No website content provided.";

        try {
            htmlContent = await fetchPageText(program.source);
            if (looksLikeLoaderPage(htmlContent)) {
                console.log("Escalating to headless browser:", program.source);
                htmlContent = await fetchPageTextWithBrowser(program.source);
            }
        } catch (error) {
            console.error(`Error fetching page text for URL ${program.source}:`, error);
        }

        const response = await fetchAiResponse(program, openai_key, ai_provider, htmlContent);
        const ai_response = JSON.parse(response);
        ai_response['staging_id'] = program.id;
        ai_response['page_fetched'] = htmlContent !== "No website content provided." || htmlContent.length > 100;

        console.log("Response:",ai_response)

        const { data } = await supabase
            .from("programs")
            .upsert([ai_response])
            .select();
        console.log(data)
        console.log("\n\n\n")
    }
}

async function transformAndUpdate () {
    let { data: programs, error } = await supabase
        .from("programs")
        .select("*")
        .ilike('eligibility', '%not specified%');

    if (error) {
        console.error("Error fetching data from Supabase:", error);
        return;
    }

    for(const program of programs) {
        let htmlContent = "No content provided.";

        try {
            htmlContent = await fetchPageText(program.source);

            if (looksLikeLoaderPage(htmlContent)) {
                console.log("Escalating to headless browser:", program.source);
                htmlContent = await fetchPageTextWithBrowser(program.source);
            }
        } catch (error) {
            console.error(`Error fetching page text for URL ${program.source}:`, error);
        }

        const response = await fetchAiResponse(program, openai_key, ai_provider, htmlContent);
        const ai_response = JSON.parse(response);
        ai_response['staging_id'] = program.id;
        ai_response['page_fetched'] = htmlContent !== "No website content provided.";

        console.log(ai_response)

        await supabase
            .from("programs")
            .update(ai_response)
            .eq('id', program.id)
            .select();
    }
}

transform();
// transformAndUpdate();