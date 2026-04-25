import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/services/pos_store";

patch(PosStore.prototype, {
    tableHasOrders(table) {
        return super.tableHasOrders(table) || Boolean(table.waitlist_reserved);
    },
});

