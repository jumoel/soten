import { Box } from "./ds/Box";
import { Inline } from "./ds/Inline";
import { Icon } from "./ds/Icon";

export function LoadingSpinner() {
  return (
    <Box py="12">
      <Inline justify="center">
        <Icon spin>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </Icon>
      </Inline>
    </Box>
  );
}
