from odoo import api, fields, models


class RestaurantTable(models.Model):
    _inherit = "restaurant.table"

    waitlist_reserved = fields.Boolean(string="Waitlist Reserved", default=False)

    @api.model
    def _load_pos_data_fields(self, config):
        fields_list = super()._load_pos_data_fields(config)
        if "waitlist_reserved" not in fields_list:
            fields_list.append("waitlist_reserved")
        return fields_list
