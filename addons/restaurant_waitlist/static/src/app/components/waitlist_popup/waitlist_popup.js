import { Component, onWillStart, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";
import { _t } from "@web/core/l10n/translation";
import { Dialog } from "@web/core/dialog/dialog";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";

const DEFAULT_FORM = {
    customer_name: "",
    party_size: 1,
    phone: "",
    note: "",
    state: "waiting",
};

export class WaitlistPopup extends Component {
    static template = "restaurant_waitlist.WaitlistPopup";
    static components = { Dialog };
    static props = {
        close: Function,
        title: { type: String, optional: true },
    };
    static defaultProps = {
        title: _t("Lista de Espera"),
    };

    setup() {
        this.pos = usePos();
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.state = useState({
            loading: false,
            records: [],
            form: { ...DEFAULT_FORM },
            selectedTableByRecordId: {},
        });

        onWillStart(() => this.loadRecords());
    }

    get occupiedTableIds() {
        const occupiedByWaitlist = this.state.records
            .filter((record) => record.state === "seated" && record.table_id?.[0])
            .map((record) => record.table_id[0]);
        const occupiedByOrders =
            typeof this.pos.getActiveOrdersOnTable === "function"
                ? this.pos
                      .models["restaurant.table"]
                      .getAll()
                      .filter((table) => this.pos.getActiveOrdersOnTable(table).length > 0)
                      .map((table) => table.id)
                : [];
        return new Set([...occupiedByWaitlist, ...occupiedByOrders]);
    }

    get availableTables() {
        return this.pos
            .models["restaurant.table"]
            .getAll()
            .filter((table) => table.active && !this.occupiedTableIds.has(table.id))
            .sort((a, b) => {
                const floorA = a.floor_id?.name || "";
                const floorB = b.floor_id?.name || "";
                if (floorA !== floorB) {
                    return floorA.localeCompare(floorB);
                }
                return a.table_number - b.table_number;
            });
    }

    async loadRecords() {
        this.state.loading = true;
        try {
            this.state.records = await this.orm.searchRead(
                "restaurant.waitlist",
                [],
                [
                    "customer_name",
                    "party_size",
                    "phone",
                    "table_id",
                    "state",
                    "registered_at",
                    "assigned_at",
                    "note",
                ],
                {
                    limit: 10,
                    order: "registered_at desc, id desc",
                }
            );
        } catch (error) {
            this.notification.add(_t("No se pudo cargar la lista de espera."), {
                type: "danger",
            });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    resetForm() {
        this.state.form = { ...DEFAULT_FORM };
    }

    getRecordTableId(recordId) {
        return this.state.selectedTableByRecordId[recordId] || "";
    }

    setRecordTableId(recordId, tableId) {
        this.state.selectedTableByRecordId[recordId] = tableId;
    }

    async refreshRecords() {
        await this.loadRecords();
    }

    async createRecord() {
        if (!this.state.form.customer_name.trim()) {
            this.notification.add(_t("El nombre del cliente es obligatorio."), {
                type: "warning",
            });
            return;
        }
        if (!this.state.form.party_size || this.state.form.party_size < 1) {
            this.notification.add(_t("El número de personas debe ser mayor que cero."), {
                type: "warning",
            });
            return;
        }

        this.state.loading = true;
        try {
            await this.orm.create("restaurant.waitlist", [{ ...this.state.form }]);
            this.resetForm();
            await this.loadRecords();
            this.notification.add(_t("Cliente agregado a la lista de espera."), {
                type: "success",
            });
        } catch (error) {
            this.notification.add(_t("No se pudo crear el registro."), {
                type: "danger",
            });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    async setState(record, state) {
        try {
            if (state === "waiting") {
                await this.orm.call("restaurant.waitlist", "action_mark_waiting", [record.id]);
            } else if (state === "cancelled") {
                await this.orm.call("restaurant.waitlist", "action_mark_cancelled", [record.id]);
            } else if (state === "seated") {
                const selectedTableId = Number(this.getRecordTableId(record.id));
                if (!selectedTableId) {
                    this.notification.add(_t("Selecciona una mesa libre antes de asignar."), {
                        type: "warning",
                    });
                    return;
                }
                await this.orm.call("restaurant.waitlist", "action_assign_table", [
                    record.id,
                    selectedTableId,
                ]);
            }
            await this.loadRecords();
        } catch (error) {
            this.notification.add(_t("No se pudo actualizar el estado."), {
                type: "danger",
            });
            console.error(error);
        }
    }

    stateClass(state) {
        return {
            waiting: "text-bg-warning",
            seated: "text-bg-success",
            cancelled: "text-bg-secondary",
        }[state] || "text-bg-primary";
    }

    deleteRecord(record) {
        this.dialog.add(ConfirmationDialog, {
            title: _t("Eliminar registro"),
            body: _t("¿Quieres eliminar este registro cancelado de la lista de espera?"),
            confirm: async () => {
                try {
                    await this.orm.unlink("restaurant.waitlist", [record.id]);
                    await this.loadRecords();
                } catch (error) {
                    this.notification.add(_t("No se pudo eliminar el registro."), {
                        type: "danger",
                    });
                    console.error(error);
                }
            },
            cancel: () => {},
        });
    }

    async assignSelectedTable(record) {
        const tableId = Number(this.getRecordTableId(record.id));
        if (!tableId) {
            this.notification.add(_t("Selecciona una mesa libre primero."), {
                type: "warning",
            });
            return;
        }
        try {
            await this.orm.call("restaurant.waitlist", "action_assign_table", [record.id, tableId]);
            await this.loadRecords();
        } catch (error) {
            this.notification.add(_t("No se pudo asignar la mesa."), {
                type: "danger",
            });
            console.error(error);
        }
    }

    async markWaiting(record) {
        await this.setState(record, "waiting");
    }

    async markCancelled(record) {
        await this.setState(record, "cancelled");
    }
}
