import { useAtom } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { machineAtom, send, pageSizeAtom } from "../atoms/globals";
import { RepoSelector } from "../components/RepoSelector";
import { Text } from "../components/ds/Text";
import { TextInput } from "../components/ds/TextInput";
import { Box } from "../components/ds/Box";
import { t } from "../i18n";

export function SettingsPage() {
  const [machine] = useAtom(machineAtom);
  const [pageSize, setPageSize] = useAtom(pageSizeAtom);
  const navigate = useNavigate();

  const repos = "repos" in machine ? machine.repos : null;
  if (!repos) return null;

  return (
    <div>
      <Box mb="6">
        <Box mb="1">
          <Text variant="label" as="label" htmlFor="page-size">
            {t("settings.pageSize")}
          </Text>
        </Box>
        <TextInput
          id="page-size"
          type="number"
          min={1}
          max={100}
          value={pageSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) setPageSize(val);
          }}
          width="20"
        />
      </Box>
      <RepoSelector
        repos={repos}
        onSelect={(owner, repo) => {
          navigate({ to: "/", replace: true });
          send({ type: "SELECT_REPO", owner, repo });
        }}
      />
    </div>
  );
}
