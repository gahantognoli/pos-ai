import { tool } from "@langchain/core/tools";
import csvtojson from "csvtojson";
import { z } from "zod";

export function getCsvToJSONTool() {
  return tool(
    async ({ csvText }) => {
      const result = await csvtojson().fromString(csvText);
      console.log("[csvToJSONTool] Converted CSV to JSON:", result);
      return result;
    },
    {
      name: "csv_to_json",
      description: "Converts CSV text to JSON format.",
      schema: z.object({
        csvText: z.string().describe("The CSV text to be converted to JSON."),
      }),
    },
  );
}
