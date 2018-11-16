"use strict";

import {JetApp, JetView} from "webix-jet";


export var adm_roles = new webix.DataCollection({
        id: "admroles_dc",
        });

export var u_roles = new webix.DataCollection({
        id: "roles_dc",
        });

export var barcodes = new webix.DataCollection({
        id: "bars_dc",
        });

export var tg = new webix.DataCollection({
        id: "tg_dc",
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

export var allTg = new webix.DataCollection({
        id: "allTg_dc",
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
    //if (err) console.log(err);
    return ret_value;
    }

export function addHran(item) {
    hran.add(item);
    }

export function delHran(item_id) {
    hran.remove(item_id);
    }

export function updHran(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.usloviya = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    //hran.updateItem(item.id, item.value);
    }

export function addIssue(item) {
    allIs.add(item);
    }

export function delIssue(item_id) {
    allIs.remove(item_id);
    }

export function updIssue(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_issue = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addStrana(item) {
    strana.add(item);
    }

export function delStrana(item_id) {
    strana.remove(item_id);
    }

export function updStrana(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_strana = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addDv(item) {
    dv.add(item);
    }

export function delDv(item_id) {
    dv.remove(item_id);
    }

export function updDv(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.act_ingr = item.value;
    citem.oa = item.oa;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addNds(item) {
    nds.add(item);
    }

export function delNds(item_id) {
    nds.remove(item_id);
    }

export function updNds(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.nds = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addSez(item) {
    sezon.add(item);
    }

export function delSez(item_id) {
    sezon.remove(item_id);
    }

export function updSez(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.sezon = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addGr(item) {
    group.add(item);
    }

export function delGr(item_id) {
    group.remove(item_id);
    }

export function updGr(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.group = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addVendor(item) {
    vendor.add(item);
    }

export function delVendor(item_id) {
    vendor.remove(item_id);
    }

export function updVendor(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_zavod = item.value;
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

export function get_tg(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getTg"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        $$("tg_dc").clearAll();
        $$("tg_dc").parse(res);
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
    //console.log(search_str);
    //params.search = params.search.replace(/\//g, "");
    //console.log('sss', params.search);
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
    let name = "<a target='_blank' rel='noreferrer noopener' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>"; //исправить на это!!!!!!!!!
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

export function dt_formating_no_sec(d) {
    return webix.Date.dateToStr("%d-%m-%Y")(d)
    };
 

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

export function mcf_filter1 (obj, value){
    //console.log("val", value);
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


    //webix.protoUI({
        //name: "customcombo",
        //$cssName:"text",
        //defaults:{
            //keepText: false,
            //separator:",",
            //icon: false,
            //iconWidth: 0,
            //tagMode: true,
            //tagTemplate: function(values){
                //return (values.length?values.length+" item(s)":"");
            //},
            //template:function(obj,common){
                //return common._render_value_block(obj, common);
            //}
        //},
        //$init:function(){
            //this.$view.className += " webix_multicombo";

            //this.attachEvent("onBeforeRender",function(){
                //if(!this._inputHeight)
                    //this._inputHeight = webix.skin.$active.inputHeight;
                //return true;
            //});
            //this.attachEvent("onAfterRender", function(){
                //this._last_size = null;
            //});

            //this._renderCount = 0;
        //},

        //on_click: {
            //"webix_multicombo_delete": function(e,view,node){
                //var value;
                //if(!this._settings.readonly && node && (value = node.parentNode.getAttribute("optvalue")))
                    //this._removeValue(value);
                //return false;
            //}
        //},
        //_onBlur:function(){
            //var value = this.getInputNode().value;
            ////blurring caused by clicks in the suggest list cannot affect new values
            //if(value && this._settings.newValues && new Date()-(this.getPopup()._click_stamp ||0)>100){
                //this._addNewValue(value);
            //}

            //if (!this._settings.keepText)
                //this._inputValue = "";
            //this.refresh();
        //},
        //_removeValue: function(value){
            //var values = this._settings.value;
            //var suggest = webix.$$(this.config.suggest);
            //if(typeof values == "string")
                //values = values.split(this._settings.separator);
            //values = webix.toArray(webix.copy(values));
            //values.remove(value);

            //this.setValue(values.join(this._settings.separator));
            //if(suggest && suggest._settings.selectAll) {
                //suggest.getBody()._cells[0].setValue(0);
            //}
        //},
        //_addValue: function(newValue){
            //var suggest = webix.$$(this.config.suggest);
            //var list = suggest.getList();
            //var item = list.getItem(newValue);

            //if(item){
                //var values = suggest.getValue();
                //if(values && typeof values == "string")
                    //values = values.split(suggest.config.separator);
                //values = webix.toArray(values||[]);
                //if(values.find(newValue)<0){
                    //values.push(newValue);
                    //suggest.setValue(values);
                    //this.setValue(suggest.getValue());
                //}
            //}
        //},
        //_addNewValue: function(value){
            //var suggest = webix.$$(this.config.suggest);
            //var list = suggest.getList();
            //var id;
            //value = value.replace(/^\s+|\s+$/g,'');

            //if(value){
                //for(var i in list.data.pull)
                    //if(suggest.getItemText(i) == value) id = i;
            //}

            //if(!id && value) id = list.add({id: value, value: value});

            //this._addValue(id);
        //},
        //_suggest_config:function(value){
            //var isObj = !webix.isArray(value) && typeof value == "object" && !value.name,
                //suggest = { view:"checksuggest", separator:this.config.separator, buttonText: this.config.buttonText, button: this.config.button },
                //combo = this;

            //if (this._settings.optionWidth)
                //suggest.width = this._settings.optionWidth;

            //if (isObj)
                //webix.extend(suggest, value, true);

            //var view = webix.ui(suggest);
            //if(!this._settings.optionWidth)
                //view.$customWidth = function(node){
                    //this.config.width = combo._get_input_width(combo._settings);
                //};
            //view.attachEvent("onBeforeShow",function(node,mode, point){
                //if(this._settings.master){
                    //this.setValue(webix.$$(this._settings.master).config.value);
                    //if(webix.$$(this._settings.master).getInputNode().value || this.isVisible()){
                        //this.getList().refresh();
                        //this._dont_unfilter = true;
                    //}
                    //else {
                        //this.getList().filter();
                        //}
                    //if(node.tagName && node.tagName.toLowerCase() == "input"){
                        //webix.ui.popup.prototype.show.apply(this, [node.parentNode,mode, point]);
                        //return false;
                    //}
                //}

            //});

            //var list = view.getList();
            //if (typeof value == "string")
                //list.load(value);
            //else if (!isObj)
                //list.parse(value);

            ////prevent default show-hide logicfunction(){
            //view._suggest_after_filter = function(){};

            //return view;
        //},
        //_render_value_block:function(obj, common){
            //var id, input, inputAlign,inputStyle, inputValue, inputWidth,
                //height, html, label, list, message, padding, readOnly,  width,
                //bottomLabel = "",
                //top =  this._settings.labelPosition == "top";

            //id = "x"+webix.uid();
            //width = common._get_input_width(obj);
            //inputAlign = obj.inputAlign || "left";

            //height = this._inputHeight - 2*webix.skin.$active.inputPadding -2;

            //inputValue = (this._inputValue||"");
            //list = "<ul class='webix_multicombo_listbox' style='line-height:"+height+"px'></ul>";

            //inputWidth = Math.min(width,(common._inputWidth||7));

            //inputStyle = "width: "+inputWidth+"px;height:"+height+"px;max-width:"+(width-20)+"px";

            //readOnly = obj.readonly?" readonly ":"";
            //input = "<input id='"+id+"' role='combobox' aria-multiline='true' aria-label='"+webix.template.escape(obj.label)+"' tabindex='0' type='text' class='webix_multicombo_input' "+readOnly+" style='"+inputStyle+"' value='"+inputValue+"'/>";
            //html = "<div class='webix_inp_static' onclick='' style='line-height:"+height+"px;width: " + width + "px;  text-align: " + inputAlign + ";height:auto' >"+list+input +"</div>";

            //label = common.$renderLabel(obj,id);

            //padding = this._settings.awidth - width - webix.skin.$active.inputPadding*2;
            //message = (obj.invalid ? obj.invalidMessage : "") || obj.bottomLabel;
            //if (message)
                //bottomLabel =  "<div class='webix_inp_bottom_label' style='width:"+width+"px;margin-left:"+Math.max(padding,webix.skin.$active.inputPadding)+"px;'>"+message+"</div>";

            //if (top)
                //return label+"<div class='webix_el_box' style='width:"+this._settings.awidth+"px; '>"+html+bottomLabel+"</div>";
            //else
                //return "<div class='webix_el_box' style='width:"+this._settings.awidth+"px; min-height:"+this._settings.aheight+"px;'>"+label+html+bottomLabel+"</div>";
        //},
        //_getValueListBox: function(){
            //return this._getBox().getElementsByTagName("UL")[0];
        //},

        //_set_inner_size: function(){
            //var popup = this.getPopup();
            //if(popup){

                //var textArr = (popup ? popup.setValue(this._settings.value) : null);
                //if(popup._toMultiValue)
                    //this._settings.value = popup._toMultiValue(this._settings.value);
                //var html = "";
                //var listbox = this._getValueListBox();
                //var text = textArr && textArr.length;
                //if(text){
                    //var height = this._inputHeight - 2*webix.skin.$active.inputPadding - 8;
                    //var values = this._settings.value;
                    //if(typeof values == "string")
                        //values = values.split(this._settings.separator);

                    //if(this._settings.tagMode){
                        //for(var i=0; i < textArr.length;i++){
                            //var content = "<span>"+textArr[i]+"</span><span class='webix_multicombo_delete' role='button' aria-label='"+webix.i18n.aria.removeItem+"'>x</span>";
                            //html += "<li class='webix_multicombo_value' style='line-height:"+height+"px;' optvalue='"+ values[i]+"'>"+content+"</li>";
                        //}
                    //}
                    //else{
                        //html += "<li class='webix_multicombo_tag' style='line-height:"+height+"px;'>"+this._settings.tagTemplate(values)+"</li>";
                    //}

                //}
                //listbox.innerHTML = html;
                //// reset placeholder
                //var inp = this.getInputNode();
                //if(this._settings.placeholder){
                    //if(text){
                        //inp.placeholder = "";
                        //if(!inp.value && inp.offsetWidth > 20)
                            //inp.style.width = "20px";
                    //}
                    //else if(!inp.value){
                        //inp.placeholder = this._settings.placeholder;
                        //inp.style.width = this._get_input_width(this._settings)+"px";
                    //}
                //}

                //if(!this._settings.tagMode && listbox.firstChild)
                    //inp.style.width = this._getMultiComboInputWidth() +"px";
            //}
            //this._resizeToContent();
        //},
        //_focusAtEnd: function(inputEl){
            //inputEl = inputEl||this.getInputNode();
            //if (inputEl){
                //if(inputEl.value.length){
                    //if (inputEl.createTextRange){
                        //var FieldRange = inputEl.createTextRange();
                        //FieldRange.moveStart('character',inputEl.value.length);
                        //FieldRange.collapse();
                        //FieldRange.select();
                    //}else if (inputEl.selectionStart || inputEl.selectionStart == '0') {
                        //var elemLen = inputEl.value.length;
                        //inputEl.selectionStart = elemLen;
                        //inputEl.selectionEnd = elemLen;
                        //inputEl.focus();
                    //}
                //}else{
                    //inputEl.focus();
                //}
            //}
        //},
        //_resizeToContent: function(){
            //var top = this._settings.labelPosition == "top";
            //var inputDiv = this._getInputDiv();
            //var inputHeight = Math.max(inputDiv.offsetHeight+ 2*webix.skin.$active.inputPadding, this._inputHeight);

            //if(top)
                //inputHeight += this._labelTopHeight;

            //inputHeight += this._settings.bottomPadding ||0;

            //var sizes = this.$getSize(0,0);

            //if(inputHeight != sizes[2]){
                //var cHeight = inputDiv.offsetHeight + (top?this._labelTopHeight:0);

                //// workaround for potential rendering loop
                //if(cHeight == this._calcHeight)
                    //this._renderCount++;
                //else
                    //this._renderCount = 0;

                //if(this._renderCount > 10)
                    //return false;

                //this._calcHeight = cHeight;

                //var topView =this.getTopParentView();
                //clearTimeout(topView._template_resize_timer);
                //topView._template_resize_timer = webix.delay(function(){
                    //this.config.height = this._calcHeight + 2*webix.skin.$active.inputPadding;
                    //this.resize();

                    //if(this._typing){
                        //this._focusAtEnd(this.getInputNode());
                        //this._typing = false;
                    //}
                    //if(this._enter){
                        //if(!this._settings.keepText)
                            //this.getInputNode().value = "";
                        //else
                            //this.getInputNode().select();
                        //this._enter = false;
                    //}
                    //if(this.getPopup().isVisible()||this._typing){
                        //this.getPopup().show(this._getInputDiv());
                    //}

                //}, this);
            //}
            //if(this._enter){
                //this.getInputNode().select();
            //}
        //},
        //_getInputDiv: function(){
            //var parentNode = this._getBox();
            //var nodes = parentNode.childNodes;
            //for(var i=0; i < nodes.length; i++){
                //if(nodes[i].className && nodes[i].className.indexOf("webix_inp_static")!=-1)
                    //return nodes[i];
            //}
            //return parentNode;
        //},
        //getInputNode: function(){
            //return this._getBox().getElementsByTagName("INPUT")[0];
        //},
        //$setValue:function(){
            //if (this._rendered_input)
                //this._set_inner_size();
        //},
        //getValue:function(config){
            //if(typeof config == "object" && config.options)
                //return this._getSelectedOptions();

            //var value = this._settings.value;
            //if (!value) return "";
            //return (typeof value != "string"?value.join(this._settings.separator):value);
        //},
        //getText:function(){
            //var value = this._settings.value;
            //if(!value) return "";
            
            //if(typeof value == "string")
                //value = value.split(this._settings.separator);

            //var text = [];
            //for(var i = 0; i<value.length; i++)
                //text.push(this.getPopup().getItemText(value[i]));
            //return text.join(this._settings.separator);
        //},
        //_getSelectedOptions: function(){
            //var i, item, popup,
                //options = [],
                //value = this._settings.value;

            //if (!value) return [];

            //if(typeof value == "string")
                //value = value.split(this._settings.separator);

            //popup = this.getPopup();

            //for(i = 0; i < value.length; i++){
                //item = popup.getList().getItem(value[i]) || (popup._valueHistory?popup._valueHistory[value[i]]:null);
                //if(item)
                    //options.push(item);
            //}

            //return options;
        //},
        //$setSize:function(x,y){
            //var config = this._settings;
            //if(webix.ui.view.prototype.$setSize.call(this,x,y)){
                //if (!x || !y) return;
                //if (config.labelPosition == "top"){
                    //config.labelWidth = 0;
                //}
                //this.render();
            //}
        //},
        //_calcInputWidth: function(value){
            //var tmp = document.createElement("span");
            //tmp.className = "webix_multicombo_input";
            //tmp.style.visibility = "visible";
            //tmp.style.height = "0px";
            //tmp.innerHTML = value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            //document.body.appendChild(tmp);
            //var width = tmp.offsetWidth+10;
            //document.body.removeChild(tmp);
            //return width;
        //},
        //_getMultiComboInputWidth: function(){
            //var listbox = this._getValueListBox();
            //return listbox.offsetWidth - listbox.firstChild.offsetWidth - 17;
        //},
        //_init_onchange:function(){
            //// input focus and focus styling
            //webix._event(this._getBox(),"click",function(){
                //this.getInputNode().focus();
            //},{bind:this});
            //webix._event(this.getInputNode(),"focus",function(){
                //if(this._getBox().className.indexOf("webix_focused") == -1)
                    //this._getBox().className += " webix_focused";

            //},{bind:this});
            //webix._event(this.getInputNode(),"blur",function(){
                //this._getBox().className = this._getBox().className.replace(" webix_focused","");
            //},{bind:this});

            //// need for clear click ("x") in IE
            //webix._event(this.getInputNode(),"input",function(){
                //if(!this.getInputNode().value && this._inputValue){
                    //this.getInputNode().style.width = "20px";
                    //this._inputWidth = 20;

                    //this._inputValue = "";
                    //this._typing = true;

                    //this.getPopup().show(this._getInputDiv());
                    //this._resizeToContent();
                //}
            //},{bind:this});
            //// resize
            //webix._event(this.getInputNode(),"keyup",function(e){
                //var inp = this.getInputNode();
                //var calcWidth, width;

                //e = (e||event);
                //// to show placeholder
                //if(this._settings.placeholder && !this._settings.value && !inp.value)
                    //width = this._get_input_width(this._settings);
                //else{
                    //width = calcWidth = this._calcInputWidth(inp.value)+10;
                    //if(!this._settings.tagMode && this._getValueListBox().firstChild)
                        //width = this._getMultiComboInputWidth();
                //}

                //inp.style.width = width +"px";

                //if(calcWidth!=this._inputWidth){
                    //if(this._settings.keepText || e.keyCode !=13){
                        //this._inputValue = inp.value;
                    //}
                    //else{
                        //this._inputValue = false;
                    //}
                    //this._typing = true;

                    //if(this._inputWidth)
                        //this.getPopup().show(this._getInputDiv());

                    //this._inputWidth = calcWidth||width;
                    //this._resizeToContent();
                //}
                //else if(this._windowHeight != this.getPopup().$height){
                    //this.getPopup().show(this._getInputDiv());
                //}

                //if(inp.value.indexOf(this._settings.separator) > -1 && this._settings.tagMode){
                    //var newValue = inp.value.replace(this._settings.separator, '');
                    //if (newValue){
                        //if (this._settings.newValues)
                            //this._addNewValue(newValue);
                        //else{
                            //var newId = this.getPopup().getItemId(newValue);
                            //if (newId)
                                //this._addValue(newId);
                        //}
                    //}

                    //if(this._settings.keepText){
                        //this._inputValue = newValue;
                        //inp.value = newValue;
                        //this._enter = true;
                        //this._typing = true;
                        //this._resizeToContent();
                    //} else{
                        //inp.value = "";
                    //}
                //}
            //},{bind:this});

            //// remove the last value on Backspace click
            //webix._event(this.getInputNode(),"keydown",function(e){
                //this._enter = false;
                //if (this.isVisible()){
                    //e = (e||event);
                    //var node = this._getValueListBox().lastChild;
                    //this._windowHeight = this.getPopup().$height;
                    //if(e.keyCode == 8 && node){
                        //if(!this.getInputNode().value && ((new Date()).valueOf() - (this._backspaceTime||0) > 100)){
                            //this._typing = true;
                            //this._removeValue(node.getAttribute("optvalue"));
                        //}
                        //else{
                            //this._backspaceTime = (new Date()).valueOf();
                        //}
                    //}

                    //if(e.keyCode == 13 || e.keyCode == 9){
                        //var input = this.getInputNode();
                        //var id = "";
                        //var suggest = webix.$$(this._settings.suggest);
                        //var list = suggest.getList();
                        //// if no selected options

                        //if(!list.getSelectedId()){
                            //if (input.value)
                                //id = suggest.getSuggestion(input.value);

                            //if(this._settings.newValues){
                                //if(e.keyCode == 13)
                                    //this._enter = true;
                                //this._addNewValue(input.value);
                                //if(this._settings.keepText)
                                    //this._inputValue = input.value;
                                //else
                                    //input.value = "";
                            //}
                            //else if(id){
                                //if(e.keyCode == 9){
                                    //this._typing = false;
                                    //this._inputValue = "";
                                    //this._inputWidth = 10;
                                    //input.value = "";
                                    //this._addValue(id);
                                //}
                                //else{
                                    //this._enter = true;
                                    //this._addValue(id);
                                    //if(this._settings.keepText)
                                        //this._inputValue = input.value;
                                    //else
                                        //input.value = "";
                                //}
                            //}

                        //}
                        //if(e.keyCode == 13){
                            //this._enter = true;
                            //this._typing = true;
                            //if(this._settings.keepText)
                                //this._inputValue = input.value;
                            //else
                                //input.value = "";
                        //}

                    //}
                //}
            //},{bind:this});
            //webix.$$(this._settings.suggest).linkInput(this);
            //}   
        //}, webix.ui.richselect);


    webix.ui.datafilter.richFilt = Object.create(webix.ui.datafilter.richSelectFilter);
    webix.ui.datafilter.richFilt.refresh = function(master, node, value){
        if (master.$destructed) return;
        var select = webix.$$(value.richselect);
        node._comp_id = master.config.id;
        node.$webix = value.richselect;
        node.style.marginLeft = "-10px";
        value.compare = value.compare || this.compare;
        value.prepare = value.prepare || this.prepare;
        master.registerFilter(node, value, this);
        var data = value.inputConfig.options;
        var options = value.options;
        var list = select.getPopup().getList();
        var optview = webix.$$(options);
        node.firstChild.appendChild(select.$view.parentNode);
        if (list.parse){
            list.clearAll();
            list.parse(data);
            if ((!this.$noEmptyOption && value.emptyOption !== false) || value.emptyOption){
                var emptyOption = { id:"-1", value: value.emptyOption||"", $empty: true };
                list.add(emptyOption,0);
                }
            };
        if (value.value) this.setValue(node, value.value);
        //console.log('select', select);
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
            var richselect = webix.ui(richconfig);
            var pager_num = config.inputConfig.pager || 2; //номер элемента на вкладке, где находится пейджер

            //console.log('master', master);
            //console.log('config', config);
            //console.log('richselect', richselect);
            richselect.$view.onresize = function() {
                //console.log('m', master);
                };
            richselect.attachEvent("onViewResize", function(){
                //console.log('master', master);
                return
                    //$$(richselect.config.popup).getList().filter("#value#", 'сиа');
                });
            
            richselect.attachEvent("onChange", function(){
                let pager_view = master.getParentView().getChildViews()[pager_num].$scope.$$("__page");
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout( () => {
                    let old_v = pager_view.getValue();
                    pager_view.setValue((+old_v ===0) ? '1' : "0");
                    pager_view.refresh();
                    //console.log("pop", richselect.config.popup)
                    //$$(richselect.config.popup).getList().filter("#value#", 'сиа');
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
            $$("allTg_dc").clearAll();
            $$("allTg_dc").parse(data.tg);
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
    console.log("params", inp_data);
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
    //console.log('req', XmlHttpRequest);
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
    let eventS = view.$scope.app.config.eventS;
    //console.log('sse', (eventS));
    if (eventS && eventS.readyState===1) {
        return true
        }
    try {
        eventS.close()
    } catch (e) {
        };
    return false
        
    // проверяем есть ли SSE соединение
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

export function add_bar(parent, view) {
    var tab_view = parent.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
    console.log('s', view.name);
    let header = (view.name === "SkippedBarView") ? "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>" :
                 (view.name === "AllUnlinkedBarView") ? "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>" :
                 (view.name === "LinksBarView") ? "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>" :
                 //(view.name === "AdmBarView") ? "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>" :
                 (view.name === "AdmBarView") ? "<span class='webix_icon fa-magic'></span><span style='line-height: 20px;'>Админка</span>" :
                 (view.name === "BrakBarView") ? "<span class='webix_icon fa-ban'></span><span style='line-height: 20px;'>Забраковка</span>" :
                 ""
    let uid = webix.uid();
    var tabConfig = {
        id: uid,
        value: header, width: 172, close: true
        };
    let formConfig = {
        $scope: parent.$scope,
        id: uid,
        $subview: view
        };
    parent.config.b_id = uid;
    tab_view.getChildViews()[2].addView(formConfig);
    tab_view.getChildViews()[1].addOption(tabConfig, true);
    }

export function setButtons(app, buttons) {
    buttons.forEach( (item, i, buttons) => {
        item.define({width: (app.config.expert) ? item.config.eWidth : item.config.sWidth,
                     label: (app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
        item.refresh();
        item.resize();
        })
    }