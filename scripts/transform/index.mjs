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
        .select("*");

    if (error) {
        console.error("Error fetching data from Supabase:", error);
        return;
    }

    for(const program of programs_staging) {
        let htmlContent = "No website content provided.";
        let isFetched = false;

        try {
            htmlContent = await fetchPageText(program.source);
            if (looksLikeLoaderPage(htmlContent)) {
                console.log("Escalating to headless browser:", program.source);
                htmlContent = await fetchPageTextWithBrowser(program.source);
            }

            if (htmlContent && htmlContent.length > 100) {
                isFetched = true;
            }

        } catch (error) {
            console.error(`Error fetching page text for URL ${program.source}:`, error);
        }

        const response = await fetchAiResponse(program, openai_key, ai_provider, htmlContent);
        const ai_response = JSON.parse(response);
        console.log("Response:",ai_response)

        if(Array.isArray(ai_response)) {
            for(const single_response of ai_response) {
                single_response['staging_id'] = program.id;
                single_response['page_fetched'] = isFetched;

                const { data } = await supabase
                    .from("programs")
                    .upsert([single_response])
                    .select();
                console.log(data)
                console.log("\n\n\n")
            }
        } else {
            ai_response['staging_id'] = program.id;
            ai_response['page_fetched'] = isFetched;

            const { data } = await supabase
                .from("programs")
                .upsert([ai_response])
                .select();
            console.log(data)
            console.log("\n\n\n")
        }
    }
}

transform();
