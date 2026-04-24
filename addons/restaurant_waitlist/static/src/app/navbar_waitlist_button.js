import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { Navbar } from "@point_of_sale/app/components/navbar/navbar";
import { WaitlistPopup } from "./components/waitlist_popup/waitlist_popup";

patch(Navbar.prototype, {
    async onClickWaitlist() {
        this.dialog.add(WaitlistPopup, {
            title: _t("Lista de Espera"),
        });
    },
});
