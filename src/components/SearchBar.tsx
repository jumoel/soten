import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { searchQueryAtom } from "../atoms/globals";
import { SearchField } from "../design";
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
    <SearchField
      id="note-search"
      label={t("search.placeholder")}
      placeholder={t("search.placeholder")}
      value={local}
      onChange={setLocal}
    />
  );
}
