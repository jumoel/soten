import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { TextInput } from "./ds/TextInput";
import { searchQueryAtom } from "../atoms/globals";
import { t } from "../i18n";

export function SearchBar() {
  const query = useAtomValue(searchQueryAtom);
  const setQuery = useSetAtom(searchQueryAtom);
  const [local, setLocal] = useState(query);

  useEffect(() => {
    if (query === "") setLocal("");
  }, [query]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(local), 150);
    return () => clearTimeout(id);
  }, [local, setQuery]);

  return (
    <TextInput
      type="search"
      placeholder={t("search.placeholder")}
      aria-label={t("search.placeholder")}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      width="full"
    />
  );
}
