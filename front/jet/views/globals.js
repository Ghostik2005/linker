"use strict";

import {JetApp, JetView} from "webix-jet";


// export var adm_roles = new webix.DataCollection({
//         id: "admroles_dc",
//         });

export var u_roles = new webix.DataCollection({
        id: "roles_dc",
        });

export var barcodes = new webix.DataCollection({
        id: "bars_dc",
        });

export var prcs = new webix.DataCollection({
        id: "prcs_dc",
        on: {
            onAfterLoad: function() {
                let cur_pos = this.data.order[0];
                this.setCursor(cur_pos);
                let th = $$("main_ui");
                let state = $$("_suppl").config.state;
                if (state) {
                    $$("_suppl").config.state = false;
                } else {
                    parse_unlinked_item(th);
                    };
                },
            }
        });

export var allIs = new webix.DataCollection({
        id: "allIs_dc",
        });

export var strana = new webix.DataCollection({
        id: "strana_dc",
        });

export var vendor = new webix.DataCollection({
        id: "vendor_dc",
        });

export var dv = new webix.DataCollection({
        id: "dv_dc",
        });

export var nds = new webix.DataCollection({
        id: "nds_dc",
        });

export var sezon = new webix.DataCollection({
        id: "sezon_dc",
        });

export var hran = new webix.DataCollection({
        id: "hran_dc",
        });

export var group = new webix.DataCollection({
        id: "group_dc",
        });

export function compareTrue () {
    return true;
    }
    
export var cEvent = function(a,b,c,d){
    d = d || {};
    d.inner = true;
    webix.event(a,b,c,d);
    };

export var unFilter = function(cv) {
    var columns = cv.config.columns;
    columns.forEach(function(item){
        if (cv.isColumnVisible(item.id)) {
            if (item.header[1]) {
                if (item.header[1].content) {
                    let filt = cv.getFilter(item.id);
                    if (typeof(filt.setValue) === 'function') {
                        cv.getFilter(item.id).setValue('');
                    } else {
                        if (!filt.readOnly) filt.value = '';
                        };
                    }
                }
            }
        });
    }
    
export function checkKey(code) {
    let ret = false;
    if (code === 8 || code === 13 || code === 32 || code === 46 || (code > 47 && code < 91) || (code > 95 && code < 112) || (code > 185 && code < 193) || (code > 219 && code < 223)) ret = true;
    return ret
    }

export function checkVal(result, mode) {
    var ret_value;
    var err;
    if (mode === 's') {
        ret_value = JSON.parse(result);
    } else if (mode === 'a') {
        ret_value = result.json();
        };
    if (ret_value.result) {
        ret_value = ret_value.ret_val;
    } else {
        ret_value = undefined;
        err = 'error';
        }
    return ret_value;
    }

export function addHran(item, source) {
    source.add(item,0);
    hran.add(item,0);
    }

export function delHran(item_id, source) {
    source.remove(item_id);
    hran.remove(item_id);
    }

export function updHran(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.usloviya = item.value;
    source.updateItem(cid, citem);
    hran.updateItem(cid, citem);
    source.refresh();
    //hran.updateItem(item.id, item.value);
    }

export function addIssue(item, source) {
    source.add(item, 0);
    allIs.add(item, 0);
    }

export function delIssue(item_id, source) {
    source.remove(item_id);
    allIs.remove(item_id);
    }

export function updIssue(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_issue = item.value;
    allIs.updateItem(cid, citem);
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addStrana(item, source) {
    source.add(item, 0);
    strana.add(item,0);
    }

export function delStrana(item_id, source) {
    source.remove(item_id);
    strana.remove(item_id);
    }

export function updStrana(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_strana = item.value;
    strana.updateItem(cid, citem);
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addDv(item, source) {
    source.add(item, 0);
    dv.add(item, 0);
    }

export function delDv(item_id, source) {
    source.remove(item_id);
    dv.remove(item_id);
    }

export function updDv(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.act_ingr = item.value;
    citem.oa = item.oa;
    dv.updateItem(cid, citem);
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addNds(item, source) {
    source.add(item,0);
    nds.add(item,0);
    }

export function delNds(item_id, source) {
    source.remove(item_id)
    nds.remove(item_id);
    }

export function updNds(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.nds = item.value;
    source.updateItem(cid, citem);
    nds.updateItem(cid, citem);
    source.refresh();
    }

export function addSez(item, source) {
    source.add(item, 0);
    sezon.add(item, 0);
    }

export function delSez(item_id, source) {
    source.remove(item_id);
    sezon.remove(item_id);
    }

export function updSez(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.sezon = item.value;
    source.updateItem(cid, citem);
    sezon.updateItem(cid, citem);
    source.refresh();
    }

export function addTGr(item, source) {
    item.c_tgroup = item.group;
    delete item.group;
    source.add(item, 0);
    }

export function delTGr(item_id, source) {
    source.remove(item_id);
    }

export function updTGr(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_tgroup = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }


export function addGr(item, source) {
    source.add(item,0);
    group.add(item,0);
    }

export function delGr(item_id, source) {
    source.remove(item_id);
    group.remove(item_id);
    }

export function updGr(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.group = item.value;
    group.updateItem(cid, citem);
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addVendor(item, source) {
    source.add(item, 0);
    vendor.add(item, 0);
    }

export function delVendor(item_id, source) {
    source.remove(item_id);
    vendor.remove(item_id);
    }

export function updVendor(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_zavod = item.value;
    citem.website = item.website;
    vendor.updateItem(cid, citem);
    source.updateItem(cid, citem);
    source.refresh();
    }

export function parseToLink(item){
    let suppl_dt = $$("_suppl").getList()
    let data = suppl_dt.data.order;
    let cid;
    let app = $$("main_ui").$scope.app
    let url = app.config.r_url + "?setWork"
    let params = {"user": app.config.user, "sh_prc": item.sh_prc};
    let res = checkVal(request(url, params, !0).response, 's');
    data.forEach(function(d_item, i, data) {
        if (suppl_dt.getItem(d_item).c_vnd === item.c_vnd) {
            cid = suppl_dt.getItem(d_item).id;
            };
        });
    if (cid) {
        suppl_dt.getItem(cid).count += 1;
        $$("_suppl").setValue(cid);
        setTimeout(function(){
            let ii = prcs.getItem(item.id);
            if (!ii) {
                prcs.add(item, 0);
                let iid = prcs.data.order[0];
                prcs.setCursor(iid);
                //prcs.setCursor(cid);
                //prcs.setCursor(item.id);
                parse_unlinked_item(this, item);
            } else {
                prcs.setCursor(item.id);
                parse_unlinked_item(this, item);
                }
            }, 400);
    } else {
        let min = 1000000000000;
        let max = 2000000000000;
        var rand = Math.round(min - 0.5 + Math.random() * (max - min + 1));
        let p_item = {"id": rand, "count": 1, "c_vnd": item.c_vnd, "id_vnd": item.id_vnd}
        $$("_suppl").config.manual = true;
        suppl_dt.add(p_item);
        $$("_suppl").setValue(rand);
        setTimeout(function(){
            prcs.clearAll();
            prcs.add(item, 0);
            let iid = prcs.data.order[0];
            prcs.setCursor(iid);
            parse_unlinked_item(this, item);
        }, 400);
        };
    }

export function get_bars(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getBar"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        $$("bars_dc").clearAll();
        $$("bars_dc").parse(res);
        };
    }

export function refLoad(app, type) {
    let params ={"user": app.config.user};
    let r_url = app.config.r_url;
    let data = [];
    let url = (type === 'gr') ? "?getGroupAll":
              (type === 'dv') ? "?getDvAll":
              //(type === 'recipt') ? "q":
              (type === 'sezon') ? "?getSezonAll":
              //(type === 'mandat') ? "q":
              (type === 'hran') ? "?getHranAll":
              (type === 'issue') ? "?getIssueAll":
              (type === 'nds') ? "?getNdsAll":
              undefined
    if (url) {
        url = r_url + url;
        data = refReload(url, params)
    } else {
        data = [
            {"id": "_set_", "value": "Установить"},
            {"id": "_unset_", "value": "Снять"},
        ];
    };
    if (data.length > 2) {
        data.forEach( function(item) {
            let val = (type === 'gr') ? item.group:
                      (type === 'dv') ? item.act_ingr:
                      (type === 'sezon') ? item.sezon:
                      (type === 'hran') ? item.usloviya:
                      (type === 'issue') ? item.c_issue:
                      (type === 'nds') ? item.nds:
                      undefined
            item.value = val;
        })
    }

    return data

}

export function itemsSet(items) {
    let ids = []
    items.forEach(function(item){
        ids.push(item.id_spr);
    });
    return ids;
}

export function refReload(url, params, async) {
    if (async) {
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                async.parse(data);
            };
        })
    } else {
        let data = request(url, params, !0).response;
        data = checkVal(data, 's');
        if (data) {
            return data;
        } else {
            return [];
        };
    }
}

export function vendorReload (app, async) {
    let url = app.config.r_url + "?getVendorAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function dvReload (app, async) {
    let url = app.config.r_url + "?getDvAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function ndsReload (app, async) {
    let url = app.config.r_url + "?getNdsAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function sezonReload (app, async) {
    let url = app.config.r_url + "?getSezonAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function issueReload (app, async) {
    let url = app.config.r_url + "?getIssueAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function hranReload (app, async) {
    let url = app.config.r_url + "?getHranAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function grReload (app, async) {
    let url = app.config.r_url + "?getGroupAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function stranaReload (app, async) {
    let url = app.config.r_url + "?getStranaAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function tgReload (app, async) {
    let url = app.config.r_url + "?getTgAll"
    let params = {"user": app.config.user};
    return refReload(url, params, async)
};

export function get_tg(app, id_spr) {
    let user = app.config.user;
    let url = app.config.r_url + "?getTg"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        //$$("tg_dc").clearAll();
        //$$("tg_dc").parse(res);
        return res;
    } else {
        return [];
    };
}


export function clear_obj(obj) {
    for (var k in obj) {
        let val = obj[k];
        if (typeof(val) === 'object') {
            val = clear_obj(val)
        } else {
            if (val==undefined) {
                delete obj[k];
                }
            }
        }
    return obj
    }

export function gen_params(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    let se_s = inp_params.searchBar;
    let field = (inp_params.field) ? inp_params.field : undefined;
    let direction = (inp_params.direction) ? inp_params.direction : undefined;
    let search_str = (se_s) ? $$(se_s).getValue() : undefined;
    let c_filter = (inp_params.filter) ? inp_params.filter : undefined;
    let user = app.config.user;
    let url = app.config.r_url + "?" + inp_params.method;
    let params = {"user": user, "search": search_str, "start": inp_params.start, "count": inp_params.count,
                  "field": field, "direction": direction, "c_filter": c_filter, "cbars": inp_params.cbars};
    params = clear_obj(params);
    return params
    }

export function str_join(obj) {
    let ret = ''
    for (var k in obj) {
        let val = obj[k];
        if (typeof(val) === 'object') {
            val = str_join(val)
        } else {
            ret += val.toString()
            }
        }
    return ret
    }

export function get_data_test(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    if (view) view.clearAll();
    let nav = inp_params.navBar;
    let url = app.config.r_url + "?" + inp_params.method;
    let params = gen_params(inp_params);
    let search_str = params.search;
    if (search_str === "") search_str="%%";
    let rl = (typeof search_str !== "undefined") ? search_str.replace(/\ /g, "").length : 2;
    let sl = (typeof search_str !== "undefined") ? search_str.length : 2;
    if (sl > 1 && rl > 1) {
        view.showProgress({
            type: "icon",
            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
            });
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                if (data.params) {
                    let c_params = str_join(gen_params(inp_params));
                    let r_params = str_join(data['params']);
                    if (r_params !== c_params) { 
                        view.hideProgress();
                        return
                        }
                    }
                view.parse(data.datas);
                view.config.startPos = data.start;
                view.config.totalPos = data.total;
                let total_page = Math.ceil(view.config.totalPos / view.config.posPpage);
                let c_page = (total_page !== 0) ? Math.ceil(view.config.startPos / view.config.posPpage) : 1;
                let pa = nav.getChildViews()[2]
                let co = nav.getChildViews()[6]
                co.define('label', "Всего записей: " + view.config.totalPos);
                co.refresh();
                let old_p = nav.$scope.$$("__page").getValue()
                try {
                    old_p = +old_p;
                } catch (ee) {
                    };
                if (old_p !==c_page) nav.$scope.$$("__page").config.manual = false;
                let pa1 = pa.getChildViews();
                pa1[2].define('label', total_page);
                pa1[2].refresh();
                nav.$scope.$$("__page").setValue(c_page);
                nav.$scope.$$("__page").refresh();
                let hist = webix.storage.session.get(view.config.name);
                if (hist) {
                    if (search_str !== "%%") hist.push(search_str);
                } else {
                    let ssstr = (search_str !== "%%") ? search_str : ''
                    hist = [ssstr,]
                    }
                webix.storage.session.put(view.config.name, hist);
                };
            view.hideProgress();
            });
        } else {
            };
 
    }

export function parse_unlinked_item(th, c_item) {
    //c_item = (c_item) ? c_item : $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    c_item = c_item || $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    let n_item = {} 
    let link = "https://www.google.ru/search?newwindow=1&q=" + c_item.c_tovar;
    let name = "<a target='_blank' rel='noreferrer noopener' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    //let name = "<a target='_balnk' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    let count = "<span style='color: #666666; text-decoration: underline;'>Осталось свести в текущей сессии:</span><span style='color: red; font-weight: bold;'>  "+ $$("prcs_dc").count() + "</span>";
    n_item['_name'] = name;
    n_item['_count'] = count;
    n_item['_vendor'] = c_item.c_zavod;
    n_item['p_name'] = c_item.c_tovar;
    let app_c = $$("main_ui").$scope.app.config;
    if (app_c.roles[app_c.role].spradd) $$("_add").show();
    $$("_left").show();
    $$("_skip").show();
    $$("_right").show();
    $$("_names_bar").parse(n_item);
    let buf = c_item.c_tovar.split(' ');
    let sta = 0;
    if (buf[sta].length < 4) sta += 1;
    let s_stri = buf[sta];
    for (var i = sta; i < buf.length; i++ ){
        var tmp = buf[i];
        for (var n=0; n < tmp.length; n++ ){
            let ttt = parseInt(tmp[n], 10);
            let q = !isNaN(tmp[n]);
            if (q) s_stri += ' ' + tmp[n];
            }
        }
    s_stri = s_stri.replace('"', " ");
    s_stri = s_stri.replace('!', " ");
    s_stri = s_stri.replace("-", " ");
    s_stri = s_stri.replace(".", " ");
    s_stri = s_stri.replace(",", " ");
    s_stri = s_stri.replace("*", " ");
    s_stri = s_stri.replace("+", " ");
    s_stri = s_stri.replace("/", " ");
    s_stri = s_stri.replace("\\", " ");
    $$("_spr_search").setValue(s_stri);
    let vv = $$('app-nav').getChildViews()[3].getChildViews(); //datatable form
    //count = vv[0].config.posPpage //datatable
    let dtParams = getDtParams(vv[0]);
    get_data_test({
        view: vv[0],
        navBar: vv[1],
        start: 1,
        //count: count,
        searchBar: vv[0].config.searchBar,
        method: vv[0].config.searchMethod,
        field: dtParams[2],
        direction: dtParams[3],
        filter: dtParams[0],
        count: dtParams[1],
        });
    $$("_spr_search").focus();
    }

export function get_spr(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getSpr"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        return res[0]
    } else {
        webix.message('error');
        return 'error';
        };
    }

export function getDtParams(ui) {
    let c_filter;
    if (ui.config.name === "__ttl") {
        c_filter = {
            'id'        : ($$(ui).isColumnVisible('id')) ? $$(ui).getFilter('id').value : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'spr'       : ($$(ui).isColumnVisible('spr')) ? $$(ui).getFilter('spr').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            };
    } else if (ui.config.name === "__tt") {
        c_filter = {
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            };
    } else if (ui.config.name === "__dt_a") {
        c_filter = {
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').getText() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt_s") {
        c_filter = {
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt_as") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'id_zavod'  : ($$(ui).isColumnVisible('id_zavod')) ? $$(ui).getFilter('id_zavod').getValue() : undefined,
            'id_strana' : ($$(ui).isColumnVisible('id_strana')) ? $$(ui).getFilter('id_strana').getValue() : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            'c_group'   : ($$(ui).isColumnVisible('c_group')) ? $$(ui).getFilter('c_group').getValue() : undefined,
            'c_nds'     : ($$(ui).isColumnVisible('c_nds')) ? $$(ui).getFilter('c_nds').getValue() : undefined,
            'c_hran'    : ($$(ui).isColumnVisible('c_hran')) ? $$(ui).getFilter('c_hran').getValue() : undefined,
            'c_sezon'   : ($$(ui).isColumnVisible('c_sezon')) ? $$(ui).getFilter('c_sezon').getValue() : undefined,
            'mandat'    : ($$(ui).isColumnVisible('mandat')) ? $$(ui).getFilter('mandat').getValue() : undefined,
            'prescr'    : ($$(ui).isColumnVisible('prescr')) ? $$(ui).getFilter('prescr').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt") {
        c_filter = {
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            };
    } else if (ui.config.name === "__brak") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "rlslink") {
        c_filter = {
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'c_vnd'     : 51078,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            //'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').getText() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "relink") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'id_zavod'  : ($$(ui).isColumnVisible('id_zavod')) ? $$(ui).getFilter('id_zavod').getValue() : undefined,
            'id_strana' : ($$(ui).isColumnVisible('id_strana')) ? $$(ui).getFilter('id_strana').getValue() : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            'c_group'   : ($$(ui).isColumnVisible('c_group')) ? $$(ui).getFilter('c_group').getValue() : undefined,
            'c_nds'     : ($$(ui).isColumnVisible('c_nds')) ? $$(ui).getFilter('c_nds').getValue() : undefined,
            'c_hran'    : ($$(ui).isColumnVisible('c_hran')) ? $$(ui).getFilter('c_hran').getValue() : undefined,
            'c_sezon'   : ($$(ui).isColumnVisible('c_sezon')) ? $$(ui).getFilter('c_sezon').getValue() : undefined,
            'mandat'    : ($$(ui).isColumnVisible('mandat')) ? $$(ui).getFilter('mandat').getValue() : undefined,
            'prescr'    : ($$(ui).isColumnVisible('prescr')) ? $$(ui).getFilter('prescr').getValue() : undefined,
            };
        }
    return [c_filter, ui.config.posPpage, ui.config.fi, ui.config.di]
    }

export function dt_formating_sec(d) {
    return webix.Date.dateToStr("%d-%m-%Y  %G:%i:%s")(d)
    };
    
export function dt_formating(d) {
    return webix.Date.dateToStr("%d-%m-%Y")(d)
    };

export function mcf_filter (obj, value){
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return obj.value.toString().toLowerCase().search(value) != -1;
    };
    
export function init_first(app) {

    webix.i18n.setLocale('ru-RU');

    webix.protoUI({
        name:"activeList"
        },webix.ui.list, webix.ActiveContent);
        
    webix.protoUI({
        name: "cWindow",
        defaults: {
            resize: true,
            modal: false,
            move: true,
            position: "center"
            },
        $init: function(config){
            webix.extend(config, {
                head: {
                    view: "toolbar",
                    cols: [
                        {view: "label", label: "Название окна"},
                        {view: "button",
                            type: "icon",
                            icon: "times",
                            css: "times",
                            height: 26,
                            width:26,
                            click: function () {
                                this.getTopParentView().hide();
                                }
                            }
                        ]
                    }
                })
            }
        }, webix.ui.window);

    webix.ui.datafilter.richFilt = Object.create(webix.ui.datafilter.richSelectFilter);
    webix.ui.datafilter.richFilt.refresh = function(master, node, value){
        //console.log('value', value);
        if (master.$destructed) return;
        var select = webix.$$(value.richselect);
        node._comp_id = master.config.id;
        node.$webix = value.richselect;
        node.style.marginLeft = "-10px";
        value.compare = value.compare || this.compare;
        value.prepare = value.prepare || this.prepare;
        master.registerFilter(node, value, this);
        var addEmpty = (value.inputConfig) ? value.inputConfig.emptyRow : undefined;
        var data = value.inputConfig.options;
        // if (addEmpty) {
        //     let ins = true;
        //     data.data.forEach( function(item) {
        //         if (item.id==='-100') ins = false;
        //     })
        //     if (ins) data.data.unshift({"id": "-100", "value": addEmpty});
        // };
        var options = value.options;
        var list = select.getPopup().getList();
        var optview = webix.$$(options);
        node.firstChild.appendChild(select.$view.parentNode);
        if (list.parse){
            list.clearAll();
            list.parse(data);
            if (addEmpty) {
                list.add({"id": "-100", "value": addEmpty}, 0);
            };
    
            if ((!this.$noEmptyOption && value.emptyOption !== false) || value.emptyOption){
                var emptyOption = { id:"-1", value: value.emptyOption||"", $empty: true };
                list.add(emptyOption,0);
                }
            };
        // if (value.columnId==="id_strana")  {
        //     console.log('value.val', value.value);
        //     console.log('this', this);
        // }
        if (value.value) this.setValue(node, value.value);
        select.render();
        webix.delay(select.resize, select);
        };

    webix.ui.datafilter.richFilt.render = function(master, config){
        if (!config.richselect){
            var d = webix.html.create("div", { "class" : "webix_richfilter" });
            var inputtype = (config.inputConfig) ? config.inputConfig.inputtype : undefined;
            var richconfig = {
                container:d,
                view: inputtype || this.inputtype,
                options:[]
                };
            var inputConfig = webix.extend( this.inputConfig||{}, config.inputConfig||{}, true );
            webix.extend(richconfig, inputConfig, true);
            if (config.separator) richconfig.separator = config.separator;
            if (config.suggest) richconfig.suggest = config.suggest;
            // var addEmpty = (config.inputConfig) ? config.inputConfig.emptyRow : undefined;
            // if (addEmpty) {
            //     console.log('asas', richconfig)
            //     richconfig.options.data.unshift({"id": "-100", "value": addEmpty});
            // }
            var richselect = webix.ui(richconfig);
            var pager_num = config.inputConfig.pager || 2; //номер элемента на вкладке, где находится пейджер
            
            richselect.attachEvent("onChange", function(){
                let cols = master.config.columns;
                cols.forEach(function(col){
                    if (col.id === richselect.config.column_name) {
                        col.header[1].height = master.getHeaderNode(col.id, 1).children[0].offsetHeight + 5;
                        master.refreshColumns();
                        }
                    })

                let pager_view = master.getParentView().getChildViews()[pager_num].$scope.$$("__page");
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout( () => {
                    let old_v = pager_view.getValue();
                    pager_view.setValue((+old_v ===0) ? '1' : "0");
                    pager_view.refresh();
                    },app.config.searchDelay);
                });
                
            config.richselect = richselect.config.id;
            };
        config.css = "webix_div_filter";
        return " ";
        }

    webix.ui.datafilter.cFilt = Object.create(webix.ui.datafilter.textFilter);
    webix.ui.datafilter.cFilt.on_key_down = function(e, node, value){
            var id = this._comp_id;
            var vi = webix.$$(id);
            if ((e.which || e.keyCode) == 9) return;
            if (!checkKey(e.keyCode)) return;
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            var pager_num = this._pager || 1; //номер элемента на вкладке, где находится пейджер
            this._filter_timer=window.setTimeout(function(){
                let pager_view = vi.getParentView().getChildViews()[pager_num].$scope.$$("__page");
                let old_v = pager_view.getValue();
                pager_view.setValue((+old_v ===0) ? '1' : "0");
                pager_view.refresh();
                },app.config.searchDelay);
            };
    webix.ui.datafilter.cFilt.refresh = function(master, node, value){
        node.component = master.config.id;
        master.registerFilter(node, value, this);
        node._comp_id = master.config.id;
        if (value.inputConfig) {
            node._pager = value.inputConfig.pager;
            }
        if (value.value && this.getValue(node) != value.value) this.setValue(node, value.value);
        node.onclick = webix.html.preventEvent;
        cEvent(node, "keydown", this.on_key_down);
        };
    webix.ui.datafilter.cFilt.render = function(master, config){
        if (this.init) this.init(config);
        config.css = "my_filter";
        return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
        };

    let delay = app.config.searchDelay;
    setTimeout(get_refs, 0*delay, {"app": app, "type": "sync", "method": "getRoles", "store": "roles_dc"});

    getRefs(app);
    
    }

export function getRefs(app) {
    let url = app.config.r_url + "?getRefs"
    let params = {"user": app.config.user};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$("strana_dc").clearAll();
            $$("strana_dc").parse(data.strana);
            $$("vendor_dc").clearAll();
            $$("vendor_dc").parse(data.vendor);
            $$("dv_dc").clearAll();
            $$("dv_dc").parse(data.dv);
            $$("nds_dc").clearAll();
            $$("nds_dc").parse(data.nds);
            $$("hran_dc").clearAll();
            $$("hran_dc").parse(data.hran);
            $$("sezon_dc").clearAll();
            $$("sezon_dc").parse(data.sezon);
            $$("group_dc").clearAll();
            $$("group_dc").parse(data.group);
            $$("allIs_dc").clearAll();
            $$("allIs_dc").parse(data.issue);
            };
        })


}

export function clear_names_bar(th, on_error_text) {
    let vv = th.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews();
    vv[0].clearAll() //clear datatable
    //th.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[0].getChildViews()[0].setValue(''); //список поставщиков
    let n_item = {'_name': "", '_count': "", '_vendor': on_error_text || "", 'p_name': ""};
    if (th.$$("_local_add")) th.$$("_local_add").hide();
    th.$$("_local_left").hide();
    th.$$("_local_skip").hide();
    th.$$("_local_right").hide();
    th.$$('_local_link').hide();
    //this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[1].parse(n_item); //_names_bar
    th.$$("_local_names_bar").parse(n_item);
    th.$$("_local_spr_search").setValue(''); //search bar
    let pager = vv[1]; //pager
    pager.getChildViews()[6].define('label', "Всего записей: 0");
    pager.getChildViews()[6].refresh();
    pager.$scope.$$("__page").config.manual = false;
    pager.$scope.$$("__page").setValue('1');
    pager.$scope.$$("__page").refresh();
    pager.getChildViews()[2].getChildViews()[2].define('label', '1'); //total_page
    pager.getChildViews()[2].getChildViews()[2].refresh();

    }

export function get_prcs(th, id_vnd) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcs"
    let params = {"user": user, "id_vnd": +id_vnd};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            //data = data.data;
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "Товары у кого-то на сведении");
                }
        } else {
            webix.message('error');
            };
        })
    }

export function get_prcs_source(th, source) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcsSou"
    let params = {"user": user, "source": +source};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            //data = data.data;
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "Товары у кого-то на сведении");
                }
        } else {
            webix.message('error');
            };
        })
    }

export function get_prcs_date(th,da) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcsDate"
    let params = {"user": user, "date": da};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            //data = data.data;
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "Товары у кого-то на сведении");
                }
        } else {
            webix.message('error');
            };
        })
    }


export function get_refs(inp_params){
    let app = inp_params.app;
    let method = inp_params.method;
    let store = inp_params.store;
    let user = app.config.user;
    let url = app.config.r_url + "?" + method
    let params = {"user": user};
    let type = inp_params.type;
    if (type !== "sync") {
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                $$(store).clearAll();
                $$(store).parse(data);
            } else {
                webix.message('error');
                };
            })
    } else {
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        if (res) {
            $$(store).clearAll();
            $$(store).parse(res);
            };
        };
    }

export function get_suppl(view, th, method) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + method
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$(view).getList().clearAll();
            $$(view).getList().parse(data);
            let fid = $$(view).getList().getFirstId();
            $$(view).setValue(fid);
            $$(view).refresh();
        } else {
            //webix.message('error');
            };
        })
    }

export function delPrc(inp_data, th) {
    let cursor = prcs.getCursor();
    let data = $$("prcs_dc").data.order;
    let _c;
    data.forEach(function(item, i, data) {
        if (item === cursor) _c = i
        });
    if (_c === $$("prcs_dc").count()-1) _c = 0;
    else _c += 1
    let new_cursor = $$("prcs_dc").data.order[+_c]
    prcs.remove(cursor);
    if (prcs.count() < 1){
        (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", th, "?getDatesUnlnk") :
        (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", th, "?getSourceUnlnk") :
                                             get_suppl("_suppl", th, "?getSupplUnlnk");
    } else {
        //cursor = prcs.data.order[0];
        prcs.setCursor(new_cursor);
        parse_unlinked_item(th);
        let ll = $$("_suppl").getList();
        let cc = $$("_suppl").getValue();
        let iti = ll.getItem(cc);
        iti.count = iti.count - 1;
        ll.updateItem(cc, iti);
        $$("_suppl").refresh();
        };
    }

export function after_call(text, data, XmlHttpRequest) {
    if (XmlHttpRequest.status == 403) {
        deleteCookie("linker-app");
        //Удалить то что ниже в понедельник 1 октября после обновления
        deleteCookie('linker_user');
        deleteCookie('linker_auth_key');
        deleteCookie('linker_role');
        /////////////////
        //alert('Требуется войти в систему');
        location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
        };

    }

export function request (url, params, mode) {
    var req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
                        : webix.ajax().timeout(90000).headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
    return req
    }

export function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : NaN;
    };

export function setCookie(name, value, options) {
    options = options || {};
    var expires = options.expires;
    if (typeof expires == "number" && expires) {
        var d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    };
    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    };
    value = encodeURIComponent(value);
    var updatedCookie = name + "=" + value;
    for (var propName in options) {
        updatedCookie += "; " + propName;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        };
    };
    document.cookie = updatedCookie;
    }

export function deleteCookie (name) {
    setCookie(name, "", {
        'expires': -1, 'path': '/'
        })
    }

export function checkSSE(view) {
    // проверяем есть ли SSE соединение
    let eventS = view.$scope.app.config.eventS;
    if (eventS && eventS.readyState===1) {
        return true
        }
    try {
        eventS.close()
    } catch (e) {
        };
    return false
        

    //return false
    }

export function spinIconEnable(view) {
    if (view.config.label.indexOf("fa-spin") === -1) {
        let l = view.config.label.replace("webix_icon", "webix_icon fa-spin");
        view.define({"label": l});
        view.refresh();
        }
    }

export function spinIconDisable(view) {
    let l = view.config.label.replace(" fa-spin", "");
    view.define({"label": l});
    view.refresh();
    clearTimeout(view.config.qw);
    }

export function setButtons(app, buttons) {
    buttons.forEach( (item, i, buttons) => {
        item.define({width: (app.config.expert) ? item.config.eWidth : item.config.sWidth,
                     label: (app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
        item.refresh();
        item.resize();
        })
    }

export function DelEdIcons (can_delete) {
    console.log('th_d', this);
    let del_img = "<div class='webix_image image20x20', style='background-image:url(./addons/img/delete_20x20.svg);'</div>";
    let edit_img = "<div class='webix_image image20x20', style='background-image:url(./addons/img/edit_20x20.svg);'</div>";
    let del_but = "<div class='webix_el_button posi'><button class='webix_img_btn_abs delete_button'>" + del_img + "</button> </div>";
    let edit_but = "<div class='webix_el_button posi'><button class='webix_img_btn_abs edit_button'>" + edit_img + "</button> </div>";
    return (can_delete) ? del_but + edit_but : edit_but;
}

export function refTemplate(obj, common, value) {
    console.log('th', this);
    let colSize = (obj.delete===false) ? "_1" : "_2";
    let col = "<div class='right_col"+ colSize + "'>" + value + "</div>";
    return "<div class = 'dt_hover'>" + common.itemIcon((obj.delete===false)?false:true) + col + "</div>";
}