import { TriangleAlertIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { QuantityChip } from "@/components/quantity-chip";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useSaveImport } from "@/hooks/use-transfer";
import { formatQuantityWithUnit } from "@/lib/format";
import { t } from "@/lib/i18n";
import {
  analyzeImport,
  type ConflictResolution,
  type ImportConflict,
  type ImportPreview,
} from "@/lib/transfer/import";
import { clearPendingImport, type PendingImport } from "@/lib/transfer/session";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface ImportFlowProps {
  pending: PendingImport | null;
  /** 6h „Verwerfen“. */
  onDiscard: (pending: PendingImport) => void;
  /** Nach dem Speichern, mit dem endgültigen Listennamen (Namensregel „(n)“). */
  onSaved: (listName: string) => void;
}

/**
 * Vorschau (6h) und Konflikte (6i) einer empfangenen bzw. geöffneten Liste als hohes Modal mit
 * festem Footer. „Abbrechen“ in 6i führt zurück zur Vorschau, vorgewählt ist „Behalten“.
 */
export function ImportFlow({ pending, onDiscard, onSaved }: ImportFlowProps) {
  return pending ? (
    <ImportModal key={pending.id} pending={pending} onDiscard={onDiscard} onSaved={onSaved} />
  ) : null;
}

function ImportModal({
  pending,
  onDiscard,
  onSaved,
}: ImportFlowProps & { pending: PendingImport }) {
  const showToast = useAppToast();
  const saveImport = useSaveImport();
  const [preview] = useState(() => analyzeImport(pending.decoded));
  const [step, setStep] = useState<"preview" | "conflicts">("preview");
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>(() =>
    Object.fromEntries(preview.conflicts.map((conflict) => [conflict.key, "keep"]))
  );

  const save = () => {
    if (saveImport.isPending) return;
    saveImport.mutate(
      { pending, resolutions },
      {
        onSuccess: ({ listName }) => {
          onSaved(listName);
          clearPendingImport(pending.id);
        },
        onError: (error) => {
          console.warn("[transfer] save import", error);
          showToast({ title: t("errors.generic") });
        },
      }
    );
  };

  const accept = () => (preview.conflicts.length > 0 ? setStep("conflicts") : save());
  const close = () => (step === "conflicts" ? setStep("preview") : onDiscard(pending));

  const setAll = (resolution: ConflictResolution) =>
    setResolutions(
      Object.fromEntries(preview.conflicts.map((conflict) => [conflict.key, resolution]))
    );

  return (
    <Modal isOpen onClose={close} closeOnOverlayClick={false} size="lg">
      <ModalBackdrop />
      <ModalContent className="h-[84%]">
        {step === "preview" ? (
          <PreviewStep
            preview={preview}
            source={pending.source}
            onDiscard={() => onDiscard(pending)}
            onAccept={accept}
            saving={saveImport.isPending}
          />
        ) : (
          <ConflictStep
            conflicts={preview.conflicts}
            resolutions={resolutions}
            onChange={(key, resolution) =>
              setResolutions((current) => ({ ...current, [key]: resolution }))
            }
            onSetAll={setAll}
            onCancel={() => setStep("preview")}
            onSave={save}
            saving={saveImport.isPending}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

function PreviewStep({
  preview,
  source,
  onDiscard,
  onAccept,
  saving,
}: {
  preview: ImportPreview;
  source: PendingImport["source"];
  onDiscard: () => void;
  onAccept: () => void;
  saving: boolean;
}) {
  const origin =
    source.kind === "network"
      ? t("importList.fromDevice", { device: source.peerName })
      : t("importList.fromFile");
  const subtitle = [
    preview.listName,
    t("lists.productCount", { count: preview.items.length }),
    origin,
  ].join(" · ");

  return (
    <>
      <ModalHeader className="flex-col items-start pt-5">
        <Text role="heading" className="text-xl font-extrabold">
          {t("importList.title")}
        </Text>
        <Text className="mt-1 text-xs text-soft">{subtitle}</Text>
      </ModalHeader>
      <ModalBody className="flex-1" contentContainerClassName="pb-3">
        {preview.items.map((item) => (
          <View
            key={item.key}
            className="min-h-13 flex-row items-center gap-2 border-b border-line py-2.5"
          >
            <Text numberOfLines={2} className="flex-1 text-base font-bold">
              {item.name}
            </Text>
            {item.conflict ? (
              <Badge variant="warning" className="self-center">
                <BadgeIcon as={TriangleAlertIcon} />
                <BadgeText>{t("importList.conflict")}</BadgeText>
              </Badge>
            ) : null}
            <QuantityChip label={formatQuantityWithUnit(item.quantity, item.unit)} />
          </View>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onPress={onDiscard} isDisabled={saving}>
          <ButtonText>{t("importList.discard")}</ButtonText>
        </Button>
        <Button onPress={onAccept} isDisabled={saving}>
          <ButtonText>{t("importList.accept")}</ButtonText>
        </Button>
      </ModalFooter>
    </>
  );
}

function conflictDetails({ categoryName, imageCount }: ImportConflict["local"]): string {
  return `${categoryName} · ${t("products.imageCount", { count: imageCount })}`;
}

function ConflictStep({
  conflicts,
  resolutions,
  onChange,
  onSetAll,
  onCancel,
  onSave,
  saving,
}: {
  conflicts: ImportConflict[];
  resolutions: Record<string, ConflictResolution>;
  onChange: (key: string, resolution: ConflictResolution) => void;
  onSetAll: (resolution: ConflictResolution) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <ModalHeader className="flex-col items-start pt-5">
        <Text role="heading" className="text-xl font-extrabold">
          {t("importConflicts.title")}
        </Text>
        <Text className="mt-1 text-xs text-soft">
          {t("importConflicts.text", { count: conflicts.length })}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <OutlineChip label={t("importConflicts.keepAll")} onPress={() => onSetAll("keep")} />
          <OutlineChip
            label={t("importConflicts.overwriteAll")}
            onPress={() => onSetAll("overwrite")}
          />
        </View>
      </ModalHeader>
      <ModalBody className="flex-1" contentContainerClassName="pb-3">
        {conflicts.map((conflict) => (
          <View key={conflict.key} className="gap-0.5 border-b border-line py-3.5">
            <Text className="text-base font-bold">{conflict.productName}</Text>
            <Text className="text-xs text-soft">
              {t("importConflicts.local", { details: conflictDetails(conflict.local) })}
            </Text>
            <Text className="text-xs text-soft">
              {t("importConflicts.incoming", { details: conflictDetails(conflict.incoming) })}
            </Text>
            <ResolutionToggle
              value={resolutions[conflict.key] ?? "keep"}
              onChange={(resolution) => onChange(conflict.key, resolution)}
            />
          </View>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onPress={onCancel} isDisabled={saving}>
          <ButtonText>{t("common.cancel")}</ButtonText>
        </Button>
        <Button onPress={onSave} isDisabled={saving}>
          <ButtonText>{t("importConflicts.save")}</ButtonText>
        </Button>
      </ModalFooter>
    </>
  );
}

function OutlineChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      className="h-9 justify-center rounded-[999px] border border-line bg-surface px-3.5 active:bg-chip"
    >
      <Text className="text-sm font-bold">{label}</Text>
    </Pressable>
  );
}

const RESOLUTIONS = [
  { value: "keep", label: "importConflicts.keep" },
  { value: "overwrite", label: "importConflicts.overwrite" },
] as const;

/** SegmentedControl Behalten/Überschreiben (6i): Pille auf `chip`, gewählt = `surface`. */
function ResolutionToggle({
  value,
  onChange,
}: {
  value: ConflictResolution;
  onChange: (value: ConflictResolution) => void;
}) {
  return (
    <View className="mt-2.5 flex-row rounded-[999px] bg-chip p-0.75" role="radiogroup">
      {RESOLUTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            role="radio"
            aria-checked={selected}
            className={cn(
              "h-9.5 flex-1 items-center justify-center rounded-[999px]",
              selected && "bg-surface"
            )}
          >
            <Text
              className={cn("text-sm", selected ? "font-extrabold" : "font-semibold text-soft")}
            >
              {t(option.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
