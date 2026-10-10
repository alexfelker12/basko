import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";


interface ErrorScreenProps {
  message?: string;
}
export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <Box className="flex-1 items-center justify-center gap-2 bg-background px-8">
      <Text className="text-danger text-base font-semibold">
        Etwas ist schiefgelaufen
      </Text>
      {message && (
        <Text className="text-muted text-sm text-center">
          {message}
        </Text>
      )}
    </Box>
  );
}
