import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Keeps list filters (search, page, ...) in the URL, with a debounced search box. */
export function useListParams() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const page = Number(params.get("page") ?? 1);
  const [searchText, setSearchText] = useState(search);

  const [lastSearch, setLastSearch] = useState(search);
  if (lastSearch !== search) {
    setLastSearch(search);
    setSearchText(search);
  }

  useEffect(() => {
    if (searchText.trim() === search) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (searchText.trim()) next.set("search", searchText.trim());
      else next.delete("search");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, search, params, setParams]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return { params, search, page, searchText, setSearchText, set };
}
