from odoo import api, fields, models, _
from odoo.exceptions import UserError


class RestaurantWaitlist(models.Model):
    _name = "restaurant.waitlist"
    _description = "Lista de Espera"
    _order = "registered_at desc, id desc"

    customer_name = fields.Char(string="Nombre del cliente", required=True)
    party_size = fields.Integer(string="Número de personas", default=1, required=True)
    phone = fields.Char(string="Teléfono")
    table_id = fields.Many2one("restaurant.table", string="Mesa asignada", ondelete="set null")
    state = fields.Selection(
        selection=[
            ("waiting", "En espera"),
            ("seated", "Asignado"),
            ("cancelled", "Cancelado"),
        ],
        string="Estado",
        default="waiting",
        required=True,
    )
    registered_at = fields.Datetime(
        string="Fecha y hora de registro",
        default=fields.Datetime.now,
        required=True,
    )
    assigned_at = fields.Datetime(string="Fecha y hora de asignación")
    note = fields.Text(string="Nota")

    @api.model
    def _get_occupied_table_ids(self, table, waitlist_id=None):
        occupied_by_orders = self.env["pos.order"].search(
            [("table_id", "=", table.id), ("state", "=", "draft")]
        )
        waitlist_domain = [
            ("table_id", "=", table.id),
            ("state", "=", "seated"),
        ]
        if waitlist_id:
            waitlist_domain.insert(0, ("id", "!=", waitlist_id))
        occupied_by_waitlist = self.search(waitlist_domain)
        return bool(occupied_by_orders or occupied_by_waitlist)

    @api.model
    def action_assign_table(self, waitlist_id, table_id):
        record = self.browse(waitlist_id).exists()
        if not record:
            raise UserError(_("El registro de la lista de espera no existe."))
        table = self.env["restaurant.table"].browse(table_id).exists()
        if not table:
            raise UserError(_("La mesa seleccionada no existe."))
        if not table.active:
            raise UserError(_("La mesa seleccionada está desactivada."))
        if self._get_occupied_table_ids(table, waitlist_id=record.id):
            raise UserError(_("La mesa ya está ocupada o reservada."))

        record.write(
            {
                "state": "seated",
                "table_id": table.id,
                "assigned_at": fields.Datetime.now(),
            }
        )
        return True

    @api.model
    def action_mark_waiting(self, waitlist_id):
        record = self.browse(waitlist_id).exists()
        if not record:
            raise UserError(_("El registro de la lista de espera no existe."))
        record.write({"state": "waiting", "table_id": False, "assigned_at": False})
        return True

    @api.model
    def action_mark_cancelled(self, waitlist_id):
        record = self.browse(waitlist_id).exists()
        if not record:
            raise UserError(_("El registro de la lista de espera no existe."))
        record.write({"state": "cancelled", "table_id": False, "assigned_at": False})
        return True
