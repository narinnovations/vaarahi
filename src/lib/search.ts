import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: ["product-search", search],
    enabled: search.trim().length > 1,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${search}%`)
        .limit(8);

      console.log("Search:", search);

      console.table(
        (data ?? []).map((p) => ({
          name: p.name,
          slug: p.slug,
          category: p.category_slug,
        }))
      );

      console.log("Error:", error);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}