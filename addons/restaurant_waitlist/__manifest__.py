{
    "name": "Restaurant Waitlist",
    "version": "19.0.1.0.0",
    "category": "Point of Sale",
    "summary": "Lista de espera para restaurante o punto de venta",
    "description": "Registra clientes en espera con datos básicos y estado operativo.",
    "author": "OpenAI",
    "depends": ["base", "point_of_sale"],
    "data": [
        "security/ir.model.access.csv",
        "views/waitlist_views.xml",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            "restaurant_waitlist/static/src/app/navbar_waitlist_button.js",
            "restaurant_waitlist/static/src/app/navbar_waitlist_button.xml",
            "restaurant_waitlist/static/src/app/components/waitlist_popup/waitlist_popup.js",
            "restaurant_waitlist/static/src/app/components/waitlist_popup/waitlist_popup.xml",
        ],
    },
    "application": True,
    "installable": True,
    "license": "LGPL-3",
}
