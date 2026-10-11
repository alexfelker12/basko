import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useProductListCount } from "@/hooks/use-catalog";
import { useLastDefined } from "@/hooks/use-last-defined";
import { t } from "@/lib/i18n";
import type { CatalogProduct } from "@/lib/queries/products";

interface DeleteProductDialogProps {
  product: CatalogProduct | null;
  onClose: () => void;
  onConfirm: (product: CatalogProduct) => void;
}

/**
 * Bestätigung vor dem endgültigen Löschen (4f), z. B. „Äpfel löschen? Wird in 3 Listen verwendet.
 * Diese Einträge und alle Fotos werden ebenfalls gelöscht.“ – ohne Rückgängig.
 */
export function DeleteProductDialog({ product, onClose, onConfirm }: DeleteProductDialogProps) {
  const shown = useLastDefined(product);
  const { data: listCount } = useProductListCount(product?.id ?? null);

  return (
    <Dialog isOpen={product !== null} onClose={onClose}>
      {shown ? (
        <>
          <Text role="heading" className="text-xl font-extrabold">
            {t("deleteProduct.title", { name: shown.name })}
          </Text>
          {listCount !== undefined ? (
            <Text className="text-sm text-soft">
              {listCount > 0
                ? t("deleteProduct.usedIn", { count: listCount })
                : t("deleteProduct.unused")}
            </Text>
          ) : null}
          <AlertDialogFooter>
            <Button variant="secondary" onPress={onClose}>
              <ButtonText>{t("common.cancel")}</ButtonText>
            </Button>
            <Button variant="destructive" onPress={() => onConfirm(shown)}>
              <ButtonText>{t("common.delete")}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </>
      ) : null}
    </Dialog>
  );
}
