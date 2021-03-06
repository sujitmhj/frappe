// Copyright (c) 2016, Frappe Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('Auto Email Report', {
	refresh: function(frm) {
		if(frm.doc.report_type !== 'Report Builder') {
			if(frm.script_setup_for !== frm.doc.report) {
				frappe.call({
					method:"frappe.desk.query_report.get_script",
					args: {
						report_name: frm.doc.report
					},
					callback: function(r) {
						frappe.dom.eval(r.message.script || "");
						frm.script_setup_for = frm.doc.report;
						frm.trigger('show_filters');
					}
				});
			} else {
				frm.trigger('show_filters');
			}
		}
		if(!frm.is_new()) {
			frm.add_custom_button(__('Download'), function() {
				var w = window.open(
					frappe.urllib.get_full_url(
						"/api/method/frappe.email.doctype.auto_email_report.auto_email_report.download?"
						+"name="+encodeURIComponent(frm.doc.name)));
				if(!w) {
					msgprint(__("Please enable pop-ups")); return;
				}
			});
			frm.add_custom_button(__('Send Now'), function() {
				frappe.call({
					method: 'frappe.email.doctype.auto_email_report.auto_email_report.send_now',
					args: {name: frm.doc.name},
					callback: function() {
						msgprint(__('Scheduled to send'));
					}
				});
			});
		}
	},
	show_filters: function(frm) {
		var wrapper = $(frm.get_field('filters_display').wrapper);
		wrapper.empty();
		if(frm.doc.report_type !== 'Report Builder'
			&& frappe.query_reports[frm.doc.report]
			&& frappe.query_reports[frm.doc.report].filters) {

			// make a table to show filters
			var table = $('<table class="table table-bordered" style="cursor:pointer; margin:0px;"><thead>\
				<tr><th style="width: 50%">'+__('Filter')+'</th><th>'+__('Value')+'</th></tr>\
				</thead><tbody></tbody></table>').appendTo(wrapper);
				$('<p class="text-muted small">' + __("Click table to edit") + '</p>').appendTo(wrapper);
			var filters = JSON.parse(frm.doc.filters || '{}');
			var report_filters = frappe.query_reports[frm.doc.report].filters;

			report_filters.forEach(function(f) {
				$('<tr><td>' + f.label + '</td><td>'+ frappe.format(filters[f.fieldname], f) +'</td></tr>')
					.appendTo(table.find('tbody'));
			});

			table.on('click', function() {
				var dialog = new frappe.ui.Dialog({
					fields: report_filters,
					primary_action: function() {
						var values = this.get_values();
						if(values) {
							this.hide();
							frm.set_value('filters', JSON.stringify(values));
							frm.trigger('show_filters');
							frappe.query_report_filters_by_name = null;
						}
					}
				});
				dialog.show();
				dialog.set_values(filters);
				frappe.query_report_filters_by_name = dialog.fields_dict;
			})
		}
	}
});
