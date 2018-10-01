#coding: utf-8

import os
import sys
import glob
import json
import time
import uuid
import hashlib
import psycopg2
from io import BytesIO
from libs.connect import fb_local
from libs.connect import pg_local
from multiprocessing.dummy import Pool as ThreadPool
import libs.xlsx as xlsx
import libs.ods as ods


class API:
    """
    API class for http post access
    x_hash - API key
    """

    def __init__(self, log, w_path = '/ms71/data/linker', p_path='/ms71/data/linker/api-k', pg=False):
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        if not os.path.exists(self.path):
             os.makedirs(self.path, mode=0o777)
        if not os.path.exists(self.p_path):
             os.makedirs(self.p_path, mode=0o777)
        self.log = log
        #################################
        if pg:
            self._pg = True
            self.log("POSTGRES STARTED")
        else:
            self._pg = False
            self.log("FB STARTED")
        if self._pg:
            self.db = pg_local(self.log, udp=sys.APPCONF["udpsock"])
        else:
            self.db = fb_local(self.log)
        self.start = 1
        self.count = 20

    def setExit(self, params=None, x_hash=None):
        user = params.get('user')
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            self._setUnwork(user)
            ret = {"result": True, "ret_val": "OK"}
        return json.dumps(ret, ensure_ascii=False)

    def login(self, params=None, x_hash=None):
        user = params.get('user')
        p_hash = params.get('pass')
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            sql = f"""select r."USER", r.PASSWD, r.ID_ROLE, r.EXPERT FROM USERS r where lower(r."USER") = lower({'?' if not self._pg else '%s'})"""
            opt = (user,)
            res = self.db.request({"sql": sql, "options": opt})
            if len(res) > 0:
                md = hashlib.md5()
                md.update(res[0][1].encode())
                if md.hexdigest() == p_hash:
                    k_list = glob.glob(os.path.join(self.p_path, '*'))
                    for f_name in k_list:
                        with open(f_name, 'rb') as f_obj:
                            fuser = f_obj.read().decode().strip()
                        if fuser == user:
                            os.remove(f_name)
                            break
                    a_key = uuid.uuid4().hex
                    f_name = os.path.join(self.p_path, a_key)
                    with open(f_name, 'wb') as f_obj:
                        f_obj.write(user.encode())
                    ret = {"result": True, "ret_val": {"key": a_key, "role": str(res[0][2]), "expert": str(res[0][3]), "user":str(res[0][0])}}
        return json.dumps(ret, ensure_ascii=False)
        
    def setExpert(self, params=None, x_hash=None):
        user = params.get('user')
        expert = params.get('expert', 5)
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            sql = f"""update USERS set EXPERT = {'?' if not self._pg else '%s'} where "USER" = {'?' if not self._pg else '%s'}"""
            opt = (expert, user)
            res = self.db.execute({"sql": sql, "options": opt})
            ret = {"result": True, "ret_val": 'ok'}
        return json.dumps(ret, ensure_ascii=False)

    def saveParams(self, params=None, x_hash=None):
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            pars = params.get('pars')
            user = params.get('user')
            pars = json.dumps(pars, ensure_ascii=False)
            if user:
                if self._pg:
                    ppprs = psycopg2.Binary(pars).encode()
                else:
                    ppprs = pars.encode()
                #если у нас 
                sql = f"""update USERS set PARAMS = {'?' if not self._pg else '%s'} where "USER" = {'?' if not self._pg else '%s'}"""
                opt = (ppprs, user)
                res = self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": 'saved'}
            else:
                ret = {"result": False, "ret_val": 'No user'}
        return json.dumps(ret, ensure_ascii=False)

    def getVersion(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            opt = (user,)
            #сбрасываем все настройки в работе - заплатка, пока нет функции харт-бита в приложении
            self._setUnwork(user)
            sql = f"""select r.EXPERT, r.PARAMS FROM USERS r where r."USER" = {'?' if not self._pg else '%s'}"""
            expert, pars = self.db.request({"sql": sql, "options": opt})[0]
            try:
                pars = pars.tobytes()
                pars = pars.decode()
            except:
                pass
            expert = str(expert)
            try:
                pars = str(pars.decode())
            except:
                pass
            prod = {'version': self.log.version, 'prod': self.db.production};
            sql = """SELECT r.ID_ROLE, r.SKIPPED, r.SPRADD, r.SPREDIT, r.ADM, r.VENDORADD, r.USERADD, r.USERDEL, r.LNKDEL FROM SPR_ROLES r"""
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            r = {}
            for row in res:
                r[row[0]] = {
                    'skipped': row[1] == 1,
                    'spradd': row[2] == 1,
                    'spredit': row[3] == 1,
                    'adm': row[4] == 1,
                    'vendoradd': row[5] == 1,
                    'useradd': row[6] == 1,
                    'userdel': row[7] == 1,
                    'lnkdel': row[8] == 1,
                    }
            ret_v= {'info': prod, 'cfg': r, 'expert': expert, 'params': pars}
            ret = {"result": True, "ret_val": ret_v}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def killAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            action = params.get('action')
            sql = """SELECT r."USER" from USERS r WHERE r.ID_ROLE in (%s)""" % (','.join([str(a) for a in action]))
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            users = []
            for row in res:
                users.append(row[0])
            k_list = glob.glob(os.path.join(self.p_path, '*'))
            for f_name in k_list:
                if 'x_login' in f_name:
                    continue
                with open(f_name, 'rb') as f_obj:
                    fuser = f_obj.read().decode().strip()
                if fuser in users:
                    try: os.remove(f_name)
                    except: pass
            ret = {"result": True, "ret_val": True}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setAdmRoles(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            values = params.get('values')
            if values:
                #меняем местами столбцы и строки
                datas = {}
                for val in values:
                    upd = {'user': val.get('user'), 'admin': val.get('admin'), 'linker': val.get('linker'), 'superadmin': val.get('superadmin'), 'qqq': val.get('qqq')}
                    datas[val.get('id')] = upd
                rrr = {'user': {}, 'admin': {}, 'superadmin': {}, 'qqq': {}, 'linker': {}}
                for k in datas.keys():
                    kv = datas.get(k)
                    for kk in kv.keys():
                        item = {k: kv.get(kk)}
                        rrr[kk].update(item)
                opt = []
                for k in rrr:
                    v = rrr.get(k)
                    opt_l = [1 if v.get('skipped') or v.get('skipped')==1 else 0, 1 if v.get('spradd') or v.get('spradd')==1 else 0, 1 if v.get('spredit') or v.get('spredit')==1 else 0,
                             1 if v.get('adm') or v.get('adm')==1 else 0, 1 if v.get('vendoradd') or v.get('vendoradd')==1 else 0, 1 if v.get('useradd') or v.get('useradd')==1 else 0,
                             1 if v.get('userdel') or v.get('userdel')==1 else 0, 1 if v.get('lnkdel') or v.get('lnkdel')==1 else 0, k]
                    opt.append(opt_l)
                sql = f"""update SPR_ROLES SET SKIPPED = {'?' if not self._pg else '%s'}, SPRADD = {'?' if not self._pg else '%s'},
SPREDIT = {'?' if not self._pg else '%s'}, ADM = {'?' if not self._pg else '%s'}, VENDORADD = {'?' if not self._pg else '%s'},
USERADD = {'?' if not self._pg else '%s'}, USERDEL = {'?' if not self._pg else '%s'}, LNKDEL = {'?' if not self._pg else '%s'} where N_ROLE = {'?' if not self._pg else '%s'} returning ID_ROLE"""
                re = []
                for op in opt:
                    o = op.pop()
                    sql_e = f"""select SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL from SPR_ROLES where n_role = {'?' if not self._pg else '%s'}"""
                    r1 = self.db.execute({"sql": sql_e, "options": (o,)})
                    r1 = r1[0]
                    if tuple(op) == r1:
                        continue
                    op.append(o)
                    res = self.db.execute({"sql": sql, "options": tuple(op)})
                    if res:
                        re.append(res[0][0])
                ret = {"result": True, "ret_val": re}
            else:
                ret = {"result": False, "ret_val": 'обновлять нечего'}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTasks(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """select DISTINCT ui, v.C_VND, 'client', t.SOURCE, cou,
dateadd(-extract(millisecond from dateadd(1800000 millisecond to t.DT)) millisecond to dateadd(1800000 millisecond to t.DT))
FROM (
    SELECT r.UIN as ui, COUNT(r.UIN) as cou
    FROM PRC_TASKS r
    JOIN PRC p on r.UIN = p.UIN
    where p.N_FG = 0
    GROUP by r.UIN)
JOIN PRC t on ui = t.UIN
JOIN VND v on (v.ID_VND = t.ID_VND)"""
            opt = ()
            _return = []
            ########### заглушка, пока непонятно, нужно ли это
            #result = self.db.execute({"sql": sql, "options": opt})
            #for row in result:
                #if row[3] == 0:
                    #sou = 'Без источника'
                #elif row[3] == 1:
                    #sou = 'PLExpert'
                #elif row[3] == 2:
                    #sou = 'Склад'
                #r = {
                    #"uin"     : row[0],
                    #"vendor"  : row[1],
                    #"customer": row[2],
                    #"source"  : sou,
                    #"count"   : row[4],
                    #"dt"      : str(row[5]),
                #}
                #_return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getAdmRoles(self, params=None, x_hash=None):
        descr = {
            'skipped': 'Просмотр пропущенных',
            'spradd': 'Добавление в справочник',
            'adm': 'Администрирование',
            'spredit': 'Редактирование справочника',
            'useradd': 'Добавление пользователей',
            'userdel': 'Удаление пользователей',
            'lnkdel': 'Удаление связок',
            'vendoradd': 'Добавление производителей'
            }
        if self._check(x_hash):
            user = params.get('user')
            sql = """SELECT r.N_ROLE, r.SKIPPED, r.SPRADD, r.SPREDIT, r.ADM, r.VENDORADD, r.USERADD, r.USERDEL, r.LNKDEL FROM SPR_ROLES r"""
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            r = {'skipped': {}, 'spradd': {}, 'adm': {}, 'spredit': {}, 'useradd': {},
                'userdel': {}, 'lnkdel': {}, 'vendoradd': {}
                }
            for row in res:
                name = row[0]
                r['skipped'].update({name: row[1] == 1})
                r['spradd'].update({name: row[2] == 1})
                r['spredit'].update({name: row[3] == 1})
                r['adm'].update({name: row[4] == 1})
                r['vendoradd'].update({name: row[5] == 1})
                r['useradd'].update({name: row[6] == 1})
                r['userdel'].update({name: row[7] == 1})
                r['lnkdel'].update({name: row[8] == 1})
            rr = []
            for k in r.keys():
                kv = r.get(k)
                rrr = {'act_name': descr.get(k), 'id': k}
                for kk in kv.keys():
                    item = {kk: kv.get(kk)}
                    rrr.update(item)
                rr.append(rrr)
            ret = {"result": True, "ret_val": rr}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsItem(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            sql = f"""
select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, u."USER", v.C_VND
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
INNER JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.SH_PRC = {'?' if not self._pg else '%s'}
            """
            opt = (sh_prc,)
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8],
                    "c_user"  : row[9],
                    "c_vnd"   : row[10]
                }
                _return.append(r)

            ret = {"result": True, "ret_val": {"datas" :_return[0], 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsAll(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            filt = params.get('c_filter')
            stri = ""
            if filt:
                pars = {}
                pars['c_vnd'] = filt.get('c_vnd')
                pars['c_zavod'] = filt.get('c_zavod')
                pars['c_tovar'] = filt.get('c_tovar')
                pars['c_user'] = filt.get('c_user')
                pars['source'] = filt.get('source')
                pars['id_org'] = filt.get('id_org')
                pars['sh_prc'] = filt.get('sh_prc')
                ssss = []
                us_s = ''
                v_s = ''
                if pars['c_vnd']:
                    s = "lower(v.C_VND) like lower('%" + pars['c_vnd'] + "%')"
                    v_s = 'and %s' % s
                if pars['c_user']:
                    if pars['c_user'] == 'Не назначен':
                        s = "ru.name is null"
                    else:
                        s = "ru.name = '" + pars['c_user'] + "'"
                    us_s = 'and %s' % s
                if pars['c_tovar']:
                    s = "lower(r.C_TOVAR) like lower('%" + pars['c_tovar'] + "%')"
                    ssss.append('and %s' % s)
                if pars['sh_prc']:
                    s = "lower(r.sh_prc) like lower('%" + pars['sh_prc'] + "%')"
                    ssss.append('and %s' % s)
                if pars['id_org']:
                    s = "r.id_org like ('%" + pars['id_org'] + "')"
                    ssss.append('and %s' % s)
                if pars['c_zavod']:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars['c_zavod'] + "%')"
                    ssss.append('and %s' % s)
                if pars['source']:
                    if 0 == int(pars['source']):
                        s = "(r.SOURCE is null or r.SOURCE = 0)"
                    else:
                        s = "r.SOURCE = " + pars['source']
                    ssss.append('and %s' % s)
                dt = filt.get('dt')
                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """(r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ssss.append('and %s' % s.format(pars['start_dt']))
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """ (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """ (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ssss.append('and %s' % s.format(pars['start_dt'], pars['end_dt']))
                stri = ' '.join(ssss)
            start_p = int(params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_field = params.get('s_field')
            user = params.get('user')
            sql = f"""SELECT r.ID, r."USER", r.ID_ROLE FROM USERS r WHERE r."USER" = {'?' if not self._pg else '%s'}"""
            opt = (user,)
            id_role = int(self.db.request({"sql": sql, "options": opt})[0][2])
            us_stri = ''
            table = 'r.'
            if field == 'c_vnd':
                table = 'v.'
            elif field == 'c_user':
                table = 'ru.'
                field = 'name'
            elif field == "dt":
                table = ''
                field = "ch_date"
            field = ''.join([table, field])
            order = 'order by {0} {1}'.format(field, direction)
            sql_1 = """left join (select DISTINCT  u."GROUP" ug, u.ID_ROLE uid from USERS u) as ddd1 on ug = r.ID_ORG"""
            sql_2 = """left JOIN VND v on (r.ID_VND = v.ID_VND)""" if not v_s else """JOIN VND v on (r.ID_VND = v.ID_VND) %s""" % v_s
            sql_3 = """left join ROLES ru on uid = ru.ID"""
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, 0, v.C_VND, r.dt ch_date,
    CASE
        WHEN ru.NAME is NULL THEN 'не назначен'
        ELSE ru.NAME
    END ruu,
    r.SOURCE,
    r.in_work,
    uu."USER"
from (select r.sh_prc rsh from PRC r WHERE r.n_fg <> 1 and r.IN_WORK != 99999999 {order if 'r.' in order else ''}) as sss1
join prc r on r.SH_PRC = rsh
{sql_2}
{sql_1}
{sql_3}
left join users uu on uu.id = r.in_work
{order if 'r.' not in order else ''}"""
            sql_ = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, 0, v.C_VND, r.dt ch_date,
    CASE
        WHEN ru.NAME is NULL THEN 'не назначен'
        ELSE ru.NAME
    END ruu,
    r.SOURCE,
    r.in_work,
    uu."USER"
from prc r
{sql_2}
{sql_1}
{sql_3}
left join users uu on uu.id = r.in_work
WHERE r.n_fg <> 1 and r.IN_WORK != 99999999 {stri} {us_stri} {us_s or ''}
order by {field} {direction}"""
            sql = sql_ if (stri or us_stri or us_s) else sql
            sql_tt = sql
            sql_c = f"""select count(*) from ({sql_tt})"""
            sql = sql + self._insLimit(start_p, end_p)
            _return = []
            sql_c = f"""select count(r.SH_PRC) from  PRC r 
{sql_2 if v_s else ''}
{sql_1 if us_s else ''}
{sql_3 if us_s else ''}
left join users uu on uu.id = r.in_work
WHERE r.n_fg <> 1 and r.IN_WORK != 99999999 {stri} {us_s or ''}"""
            p_list = [{'sql': sql, 'opt': ()}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            for row in result:
                if str(row[13]) == '1':
                    sou = "PLExpert"
                elif str(row[13]) == '2':
                    sou = "Склад"
                else:
                    sou = "Без источника"
                if row[15] is None:
                    w_name = ""
                else:
                    w_name = str(row[15])
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8],
                    "c_user"  : row[12],
                    "c_vnd"   : row[10],
                    "dt"      : str(row[11]),
                    "source"  : sou,
                    "in_work" : str(row[14]),
                    "in_work_name": w_name
                }
                _return.append(r)
            ret = {"result": True, "ret_val": {"datas" :_return, "total": count, "start": start_p, 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsSkip(self, params=None, x_hash=None):
        if self._check(x_hash):
            filt = params.get('c_filter')
            pref = 'and %s'
            stri = ""
            ins_ch_date = None
            if filt:
                pars = {}
                pars['c_vnd'] = filt.get('c_vnd')
                pars['c_zavod'] = filt.get('c_zavod')
                pars['c_tovar'] = filt.get('c_tovar')
                pars['c_user'] = filt.get('c_user')
                pars['source'] = filt.get('source')
                pars['id_org'] = filt.get('id_org')
                pars['sh_prc'] = filt.get('sh_prc')
                ssss = []
                if pars['c_vnd']:
                    s = "lower(v.C_VND) like lower('%" + pars['c_vnd'] + "%')"
                    ssss.append(pref % s)
                if pars['c_user']:
                    s = "lower(u.\"USER\") like lower('%" + pars['c_user'] + "%')"
                    ssss.append(pref % s)
                if pars['c_tovar']:
                    sti = "lower(r.C_TOVAR) like lower('%%')"
                    exclude, pars['c_tovar'] = self._form_exclude(pars['c_tovar'])
                    pars['c_tovar'] = pars['c_tovar'].split()
                    s = [] if len(pars['c_tovar']) > 0 else [sti,]
                    for i in range(len(pars['c_tovar'])):
                        ts1 = "lower(r.C_TOVAR) like lower('%" + pars['c_tovar'][i].strip() + "%')"
                        if i == 0:
                            s.append(ts1)
                        else:
                            s.append('and %s' % ts1)
                    if len(exclude) > 0:
                        for i in range(len(exclude)):
                            ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                            s.append('and %s' % ts3)
                    s = ' '.join(s)
                    ssss.append(pref % s)
                if pars['c_zavod']:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars['c_zavod'] + "%')"
                    ssss.append(pref % s)
                if pars['sh_prc']:
                    s = "lower(r.sh_prc) like lower('%" + pars['sh_prc'] + "%')"
                    ssss.append(pref % s)
                if pars['id_org']:
                    s = "r.id_org like ('%" + pars['id_org'] + "')"
                    ssss.append('and %s' % s)
                if pars['source']:
                    if 0 == int(pars['source']):
                        s = "(r.SOURCE is null or r.SOURCE = 0)"
                    else:
                        s = "r.SOURCE = " + pars['source']
                    ssss.append('and %s' % s)
                dt = filt.get('dt')
                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'])
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'], pars['end_dt'])
                stri = ' '.join(ssss)
            start_p = int(params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_field = params.get('s_field')
            user = params.get('user')
            sql = f"""SELECT r.ID, r."USER", r.ID_ROLE FROM USERS r WHERE r."USER" = {'?' if not self._pg else '%s'}"""
            opt = (user,)
            id_role = int(self.db.request({"sql": sql, "options": opt})[0][2])
            us_stri = '' if id_role in [10, 34] else """and u."USER" = '%s'""" % user
            table = 'r.'
            if field == 'c_vnd':
                table = 'v.'
            elif field == 'c_user':
                table = 'u.'
                field = '"USER"'
            elif field == "dt":
                table = ''
                field = "ch_date"
            field = ''.join([table, field])
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, v.C_VND,
CASE 
    WHEN r.CHANGE_DT is null THEN r.DT
    ELSE r.CHANGE_DT
END as ch_date,
r.SOURCE
from prc r
{'inner join USERS u on (u."GROUP" = r.ID_ORG)' if us_stri != '' else ''}
INNER JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.n_fg = 1 {stri} {us_stri}
order by {field} {direction}"""
            if ins_ch_date:
                sql = "select * from (" + sql + ins_ch_date
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            opt = ()
            _return = []
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            for row in result:
                if str(row[11]) == '1':
                    sou = "PLExpert"
                elif str(row[11]) == '2':
                    sou = "Склад"
                else:
                    sou = "Без источника"
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8],
                    "c_vnd"   : row[9],
                    "dt"      : str(row[10]),
                    "source"  : sou
                    
                }
                _return.append(r)
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSupplUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            opt = (user,)
            self._setUnwork(user)
            sql = f"""select r1, v.C_VND, r2 from (
    select p.ID_VND as r1, count(p.ID_VND) as r2 from PRC p 
    inner join USERS u on (u."GROUP" = p.ID_ORG)
    WHERE p.N_FG <> 1 and u."USER" = {'?' if not self._pg else '%s'}
    GROUP BY p.ID_VND
    ) rr1
inner join VND v on (v.ID_VND = r1)
order by v.C_VND ASC"""
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {
                    "id_vnd" : row[0],
                    "c_vnd": row[1],
                    "count": row[2]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSourceUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            self._setUnwork(user)
            sql = f"""select
CASE 
    WHEN r1=0 THEN 10000
    ELSE r1
END as s_id,
CASE 
    WHEN r1 = 1 THEN 'Прайс-лист'
    WHEN r1 = 2 THEN 'Склад'
    ELSE 'Остальное'
END as source, r2 from (
    select p.SOURCE as r1, count(p.SOURCE) as r2 from PRC p 
    inner join USERS u on (u."GROUP" = p.ID_ORG)
    WHERE p.N_FG <> 1 and u."USER" = {'?' if not self._pg else '%s'}
    GROUP BY p.SOURCE
    ) rr1
order by r1 DESC"""
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {
                    "id_vnd" : row[0],
                    "c_vnd": row[1],
                    "count": row[2]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDatesUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            self._setUnwork(user)
            sql = f"""select CAST(p.DT as DATE) as r3, count(CAST(p.DT as DATE))
from PRC p 
inner join USERS u on (u."GROUP" = p.ID_ORG)
WHERE p.N_FG <> 1 and u."USER" = {'?' if not self._pg else '%s'}
GROUP BY r3"""
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {
                    "id_vnd" : str(row[0]),
                    "c_vnd": str(row[0]),
                    "count": row[1]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcs(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            id_vnd = params.get('id_vnd')
            user = params.get('user')
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE r.id_vnd = {'?' if not self._pg else '%s'} and r.n_fg <> 1 and u."USER" = {'?' if not self._pg else '%s'} and r.IN_WORK = -1
"""
            sql = sql + self._insLimit(1, 20)
            opt = (id_vnd, user)
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8]
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                ppp = ', '.join([f'\'{q}\'' for q in in_work])
                sql = f"""UPDATE PRC
SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = {'?' if not self._pg else '%s'})
where SH_PRC in ({ppp})"""
                opt = (user,)
                res = self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsSou(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            source = params.get('source')
            user = params.get('user')
            if 10000 == int(source):
                source = 0
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, r.DT
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE r.SOURCE = {'?' if not self._pg else '%s'} and r.n_fg <> 1 and u."USER" = {'?' if not self._pg else '%s'} and r.IN_WORK = -1
ORDER by r.DT ASC
            """
            sql = sql + self._insLimit(1, 20)
            opt = (source, user)
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8]
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                pprs = ', '.join([f'\'{q}\'' for q in in_work])
                sql = f"""UPDATE PRC
SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = {'?' if not self._pg else '%s'})
where SH_PRC in ({pprs})"""
                opt = (user,)
                res = self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsDate(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            da = params.get('date')
            user = params.get('user')
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, r.DT
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE CAST(r.DT as DATE) = {'?' if not self._pg else '%s'} and r.n_fg <> 1  and r.IN_WORK = -1 and u."USER" = {'?' if not self._pg else '%s'}
ORDER by r.SOURCE DESC
"""
            sql = sql + self._insLimit(1, 20)
            opt = (da, user)
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc"  : row[0],
                    "id_vnd"  : row[1],
                    "id_tovar": row[2],
                    "n_fg"    : row[3],
                    "n_cena"  : row[4],
                    "c_tovar" : row[5],
                    "c_zavod" : row[6],
                    "id_org"  : row[7],
                    "c_index" : row[8]
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                pprs = ', '.join([f'\'{q}\'' for q in in_work])
                sql = f"""UPDATE PRC 
                    SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = {'?' if not self._pg else '%s'})
                    where SH_PRC in ({pprs})"""
                opt = (user,)
                res = self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setWork(self, params=None, x_hash=None):
        if self._check(x_hash):
            _return = []
            sh_prc = params.get('sh_prc')
            user = params.get('user')
            sql = f"""UPDATE PRC SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = {'?' if not self._pg else '%s'})
                where SH_PRC = {'?' if not self._pg else '%s'} returning sh_prc"""
            opt = (user, sh_prc)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0][0]:
                _return.append(res[0][0])
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "upd error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getRefs(self, params=None, x_hash=None):
        if self._check(x_hash):
            p_list = [{'sql': "select c_strana, id_spr from spr_strana where flag=1 order by c_strana", 'opt': ()},
                    {'sql': "select c_zavod, id_spr from spr_zavod where flag=1 order by c_zavod", 'opt': ()},
                    {'sql': "select r.ID, r.ACT_INGR, r.OA from dv r where r.flag=1 order by r.ACT_INGR", 'opt': ()},
                    {'sql': "select classifier.nm_group, classifier.cd_group from classifier  where classifier.idx_group = 2", 'opt': ()},
                    {'sql': "select classifier.nm_group, classifier.cd_group from classifier where classifier.idx_group = 3", 'opt': ()},
                    {'sql': "select classifier.nm_group, classifier.cd_group from classifier where classifier.idx_group = 6", 'opt': ()},
                    {'sql': "select classifier.nm_group, classifier.cd_group from classifier where classifier.idx_group = 1", 'opt': ()},
                    {'sql': "select classifier.nm_group, classifier.cd_group from classifier where classifier.idx_group = 7 order by classifier.nm_group asc", 'opt': ()},
                    {'sql': "select r.ID, r.C_ISSUE from ISSUE r where r.flag=1 order by r.C_ISSUE", 'opt': ()}
                    ]
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            _return = []
            for row in results[0]:
                r = {
                    "id"             : row[1],
                    "c_strana"       : row[0]
                }
                _return.append(r)
            re = {'strana': _return}
            _return = []
            for row in results[1]:
                r = {
                    "id"            : row[1],
                    "c_zavod"       : row[0]
                }
                _return.append(r)
            re['vendor'] = _return
            _return = []
            for row in results[2]:
                if row[2] == 1 :
                    oa = 'Для аптек'
                elif row[2] == 2:
                    oa = 'Для аптек и аптечных пунктов'
                else:
                    oa = 'Нет'
                r = {
                    "id"        : row[0],
                    "act_ingr"  : row[1],
                    "oa"        : oa
                }
                _return.append(r)
            re['dv'] = _return
            _return = []
            for row in results[3]:
                r = {
                    "id"          : row[1],
                    "nds"         : row[0]
                }
                _return.append(r)
            re['nds'] = _return
            _return = []
            for row in results[4]:
                r = {
                    "id"               : row[1],
                    "usloviya"         : row[0]
                }
                _return.append(r)
            re['hran'] = _return
            _return = []
            for row in results[5]:
                r = {
                    "id"        : row[1],
                    "sezon"       : row[0]
                }
                _return.append(r)
            re['sezon'] = _return
            _return = []
            for row in results[6]:
                r = {
                    "id"            : row[1],
                    "group"         : row[0]
                }
                _return.append(r)
            re['group'] = _return
            _return = []
            for row in results[7]:
                r = {
                    "id"            : row[1],
                    "c_tgroup"         : row[0]
                }
                _return.append(r)
            re['tg'] = _return
            _return = []
            if isinstance(results[8], list):
                for row in results[8]:
                    r = {
                        "id"            : row[0],
                        "c_issue"         : row[1]
                    }
                    _return.append(r)
            re['issue'] = _return
            ret = {"result": True, "ret_val": re}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getStranaAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select c_strana, id_spr from spr_strana where flag=1 order by c_strana"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[1],
                    "c_strana"       : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id_spr from spr_strana where id_spr = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into spr_strana (ID_SPR, C_STRANA, FLAG)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 1) returning ID_SPR"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'c_strana' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from SPR_STRANA where ID_SPR = {'?' if not self._pg else '%s'} returning ID_SPR"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update SPR_STRANA set C_STRANA = {'?' if not self._pg else '%s'} where ID_SPR = {'?' if not self._pg else '%s'} returning ID_SPR"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id from ISSUE where id = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIssueAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select c_issue, id from ISSUE where flag=1 order by c_issue"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[1],
                    "value"     : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


    def setIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into ISSUE (ID, C_ISSUE, FLAG)
                values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 1) returning ID"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'c_issue' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "set error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id_spr from spr_issue where id_is = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (c_id,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                if result == 0:
                    sql = f"""delete from ISSUE where ID = {'?' if not self._pg else '%s'} returning ID"""
                    opt = (c_id,)
                    res = self.db.execute({"sql": sql, "options": opt})
                    if res[0]:
                        _ret = {
                            'id'    : c_id,
                        }
                        ret = {"result": True, "ret_val": _ret}
                    else:
                        ret = {"result": False, "ret_val": "del error"}
                else:
                    ret = {"result": False, "ret_val": "Существует товар с этой форрмой выпуска"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update ISSUE set c_issue = {'?' if not self._pg else '%s'} where ID = {'?' if not self._pg else '%s'} returning ID"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


    def getSupplAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """SELECT r.ID_VND, r.C_VND FROM VND r ORDER by r.C_VND"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                if row[0] is None or row[1] is None:
                    continue
                r = {
                    "id"        : row[0],
                    "value"       : row[1]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getVendorAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select c_zavod, id_spr from spr_zavod where flag=1 order by c_zavod"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[1],
                    "c_zavod"       : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id_spr from spr_zavod where id_spr = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into spr_zavod (ID_SPR, C_ZAVOD, FLAG)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 1) returning ID_SPR"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'c_zavod' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from SPR_ZAVOD where ID_SPR = {'?' if not self._pg else '%s'} returning ID_SPR"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update SPR_ZAVOD set C_ZAVOD = {'?' if not self._pg else '%s'} where ID_SPR = {'?' if not self._pg else '%s'} returning ID_SPR"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDvAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select r.ID, r.ACT_INGR, r.OA from dv r where r.flag=1 order by r.ACT_INGR"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                if row[2] == 1 :
                    oa = 'Для аптек'
                elif row[2] == 2:
                    oa = 'Для аптек и аптечных пунктов'
                else:
                    oa = 'Нет'
                r = {
                    "id"        : row[0],
                    "act_ingr"  : row[1],
                    "oa"        : oa
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id from dv where id = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            oa1 = int(params.get('oa'))
            if oa1 == 1:
                oa = 1
            elif oa1 == 2:
                oa = 2
            else:
                oa = None
            if c_id and val:
                sql = f"""insert into DV (ID, ACT_INGR, OA, FLAG)
                values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 1) returning ID"""
                opt = (c_id, val, oa)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    if oa == 1 :
                        oa1 = 'Для аптек'
                    elif oa == 2:
                        oa1 = 'Для аптек и аптечных пунктов'
                    else:
                        oa1 = 'Нет'
                    _ret = {
                        'id'    : c_id,
                        'act_ingr' : val,
                        'oa': oa1
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from DV where ID = {'?' if not self._pg else '%s'} returning ID"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            oa1 = int(params.get('oa'))
            if oa1 == 1 :
                oa = 1
            elif oa1 == 2:
                oa = 2
            else:
                oa = None
            if c_id and val:
                sql = f"""update DV set ACT_INGR = {'?' if not self._pg else '%s'}, OA = {'?' if not self._pg else '%s'} where ID = {'?' if not self._pg else '%s'} returning ID"""
                opt = (val, oa, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    if oa == 1 :
                        oa1 = 'Для аптек'
                    elif oa == 2:
                        oa1 = 'Для аптек и аптечных пунктов'
                    else:
                        oa1 = 'Нет'
                    _ret = {
                        'id'    : c_id,
                        'value' : val,
                        'oa': oa1
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSezonAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select classifier.nm_group, classifier.cd_group
            from classifier 
            where classifier.idx_group = 6
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[1],
                    "sezon"       : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select classifier.cd_group from classifier where classifier.cd_group = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into classifier (cd_group, nm_group, IDX_GROUP)
                values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 6) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'sezon' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from classifier where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update classifier set nm_group = {'?' if not self._pg else '%s'} where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getHranAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select classifier.nm_group, classifier.cd_group
            from classifier 
            where classifier.idx_group = 3
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"               : row[1],
                    "usloviya"         : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select classifier.cd_group from classifier where classifier.cd_group = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into classifier (cd_group, nm_group, IDX_GROUP)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 3) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'usloviya' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from classifier where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update classifier set nm_group = {'?' if not self._pg else '%s'} where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTgAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select classifier.nm_group, classifier.cd_group
from classifier 
where classifier.idx_group = 7
order by classifier.nm_group asc
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"            : row[1],
                    "c_tgroup"         : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getGroupAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select classifier.nm_group, classifier.cd_group
from classifier 
where classifier.idx_group = 1
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"            : row[1],
                    "group"         : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select classifier.cd_group from classifier where classifier.cd_group = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into classifier (cd_group, nm_group, IDX_GROUP)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 1) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'group' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from classifier where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update classifier set nm_group = {'?' if not self._pg else '%s'} where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getNdsAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select classifier.nm_group, classifier.cd_group
from classifier 
where classifier.idx_group = 2
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"          : row[1],
                    "nds"         : row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select classifier.cd_group from classifier where classifier.cd_group = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""insert into classifier (cd_group, nm_group, IDX_GROUP)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, 2) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'nds'   : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = f"""delete from classifier where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            val = params.get('value')
            if c_id and val:
                sql = f"""update classifier set nm_group = {'?' if not self._pg else '%s'} where cd_group = {'?' if not self._pg else '%s'} returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'    : c_id,
                        'value' : val
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            c_tovar = params.get("c_tovar").upper()
            id_strana = params.get("id_strana")
            id_zavod = params.get("id_zavod")
            id_dv = params.get("id_dv")
            c_tgroup = params.get('c_tgroup')
            user = params.get("user")
            sh_prc = params.get("sh_prc")
            _return = []
            if id_spr > 0:
                sql = f"""update SPR set C_TOVAR = {'?' if not self._pg else '%s'}, DT = CAST('NOW' AS TIMESTAMP),
ID_DV = {'?' if not self._pg else '%s'}, ID_ZAVOD = {'?' if not self._pg else '%s'}, ID_STRANA = {'?' if not self._pg else '%s'} where ID_SPR = {'?' if not self._pg else '%s'}"""
                opt = (c_tovar, id_dv, id_zavod, id_strana, id_spr)
                res = self.db.execute({"sql": sql, "options": opt})
                sql = f"""delete FROM GROUPS as g
WHERE g.CD_GROUP in 
    (SELECT c.CD_GROUP
    FROM CLASSIFIER as c
    WHERE c.IDX_GROUP in (1, 2, 3, 4, 5, 6, 7)
    )
and g.CD_CODE = {'?' if not self._pg else '%s'}"""
                opt = (id_spr,)
                t1 = self.db.execute({"sql": sql, "options": opt})
                self.setIssueSpr(params, x_hash)
                self._insGr(params, id_spr)
                self.setBar(params, x_hash)
                ret = id_spr
                new = False
            else:
                sql = f"""insert into SPR (C_TOVAR, DT, ID_DV, ID_ZAVOD, ID_STRANA)
values ({'?' if not self._pg else '%s'}, CAST('NOW' AS TIMESTAMP), {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}) returning ID_SPR"""
                opt = (c_tovar, id_dv, id_zavod, id_strana)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                if result:
                    if sh_prc:
                        pars = {'sh_prc': sh_prc, 'user': user, 'id_spr': result}
                        t1 = self.setLnk(params=pars, x_hash=x_hash)
                    self._insGr(params, result)
                    params['id_spr'] = result
                    self.setIssueSpr(params, x_hash)
                    self.setBar(params, x_hash)
                ret = result #new id_spr
                new = True
            _return.append(ret)
            rett = {"datas": _return, "new": new, 'params': params}
            ret = {"result": True, "ret_val": rett}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUsersAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """select r.ID, r."USER", r.PASSWD, r."GROUP", r.INN, a.NAME, r.ID_ROLE from users r
INNER JOIN ROLES a on (a.ID = r.ID_ROLE)"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[0],
                    "c_user"    : row[1],
                    "id_group"  : row[3],
                    "c_inn"     : row[4],
                    "c_role"    : row[5],
                    "id_role"   : 1 if row[6] == 0 else row[6],
                    "dt"        : ""
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            new_user = params.get('c_user')
            passwd = params.get('c_pwrd')
            group = params.get('id_group', -1)
            id_role = params.get('id_role')
            if id_role == 1:
                id_role = 0
            u_id = params.get('id')
            if id_role in (10, 34) and group == -1:
                group = 999999
            inn = params.get('c_inn')
            if u_id:
                sql = f"""update USERS set "USER" = {'?' if not self._pg else '%s'}, "GROUP" = {'?' if not self._pg else '%s'},
PASSWD = {'?' if not self._pg else '%s'}, INN = {'?' if not self._pg else '%s'}, ID_ROLE = {'?' if not self._pg else '%s'} where id = {'?' if not self._pg else '%s'} returning id"""
                opt = (new_user, group, passwd, inn, id_role, u_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        'id'       : res[0][0],
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "id error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get('check')
            if check:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select r."USER" from users r where r."USER" = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            new_user = params.get('c_user')
            passwd = params.get('c_pwrd')
            group = params.get('id_group')
            id_role = params.get('id_role')
            if id_role == 1:
                id_role = 0
            if id_role in (10, 34) and group == -1:
                group = 999999
            inn = params.get('c_inn')
            sql = f"""insert into USERS ("USER", "GROUP", PASSWD, INN, ID_ROLE) values ({'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}) returning id"""
            opt = (new_user, group, passwd, inn, id_role)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0]:
                _ret = {
                    'id'       : res[0][0],
                    "c_user"   : new_user,
                    "id_group" : group,
                    "c_inn"    : inn,
                    "id_role"  : id_role,
                    "dt"       : ""
                }
                ret = {"result": True, "ret_val": _ret}
            else:
                ret = {"result": False, "ret_val": "add error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            id_u = params.get('id')
            sql = f"""select r.ID, r."USER", r.PASSWD, r."GROUP", r.INN, a.NAME, r.ID_ROLE from users r
INNER JOIN ROLES a on (a.ID = r.ID_ROLE) WHERE r.ID = {'?' if not self._pg else '%s'}"""
            opt = (id_u,)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0]:
                _ret = {
                    "id"        : res[0][0],
                    "c_user"    : res[0][1],
                    "c_pwrd"    : res[0][2],
                    "id_group"  : res[0][3],
                    "c_inn"     : res[0][4],
                    "c_role"    : res[0][5],
                    "id_role"   : 1 if res[0][6] == 0 else res[0][6],
                    "dt"        : ""
                }
                ret = {"result": True, "ret_val": _ret}
            else:
                ret = {"result": False, "ret_val": "add error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBarsSpr(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            field = field.replace('c_tovar', 'barcode')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            stri = "lower(r.barcode) like lower('%{0}%')".format(search_re)
            sql_c = """select count(*) from spr_barcode r WHERE %s """ % stri
            sql_c = sql_c.replace("WHERE lower(r.barcode) like lower('%%%%')", '')
            sql = f"""select distinct r.barcode from spr_barcode r where {stri} order by r.{field} {direction} """ 
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.barcode) like lower('%%%%')", '')
            opt = ()
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            t1 = time.time() - st_t
            _return = []
            st_t = time.time()
            idc = 0
            for row in result:
                r = {
                    "id"          : idc,
                    "$row"        : "c_tovar",
                    "open"        : False,
                    "c_tovar"     : row[0],
                    "data"        : []
                }
                idc += 1
                sql = f"""select r.id_spr, s.c_tovar, r.ch_date from spr_barcode r
join spr s on (r.id_spr = s.id_spr)
where r.barcode = {'?' if not self._pg else '%s'} order by s.id_spr ASC"""
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "id_spr"    : rrr[0],
                        "c_tovar"   : rrr[1],
                        "id_state"  : "active",
                        "dt"        : str(rrr[2]) or '',
                        "owner"     : ""
                    }
                    r['data'].append(rr)
                _return.append(r)
            t3 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "time": (t1, t3), "total": count, "start": start_p, 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprBars(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            field = field.replace('barcode', 'c_tovar')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "lower(r.C_TOVAR) like lower('%%')"
            cbars = params.get('cbars')
            cbars = cbars.split(',')
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = [] if len(search_re) > 0 else [sti,]
            for i in range(len(search_re)):
                ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                    stri.append('and %s' % ts3)
            stri = ' '.join(stri)
            stri = stri.replace("lower(r.C_TOVAR) like lower('%%%%') and", '')
            sql_c = """select count(*)
from (SELECT r.ID_SPR as id, idspr, r.c_tovar as c_tovar, qty, 
        CASE 
        WHEN qty is null THEN 0
        ELSE qty
        END as quantity
    from SPR r 
    left outer join (select idspr, qty
        FROM (select s.ID_SPR as idspr,
            count(s.ID_SPR) as qty
            FROM SPR_BARCODE s
            GROUP BY idspr)
        ) as rrrr on (r.id_spr = idspr)
    WHERE {0}
    )
where quantity >= {1} AND quantity <= {2}
            """.format(stri, cbars[0], cbars[1])
            sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            sql = """select id, c_tovar, quantity
from (SELECT r.ID_SPR as id, idspr, r.c_tovar as c_tovar, qty, 
        CASE 
        WHEN qty is null THEN 0
        ELSE qty
        END as quantity
    from SPR r 
    left outer join (select idspr, qty
        FROM (select s.ID_SPR as idspr,
            count(s.ID_SPR) as qty
            FROM SPR_BARCODE s
            GROUP BY idspr)
        ) as rrrrr on (r.id_spr = idspr)
    WHERE {0}
    )
where quantity >= {1} AND quantity <= {2}
order by {3} {4}
""".format(stri, cbars[0], cbars[1], field, direction)
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            t1 = time.time() - st_t
            opt = ()
            _return = []
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            st_t = time.time()
            for row in result:
                st1 = ' | '.join([str(row[0]), row[1]])
                r = {
                    "id"          : row[0],
                    "$row"        : "barcode",
                    "open"        : False,
                    "barcode"     : st1,
                    "data"        : [],
                }
                sql = r"""select r.barcode, r.ch_date from spr_barcode r where r.id_spr = {'?' if not self._pg else '%s'} order by r.barcode ASC"""
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "barcode"   : rrr[0],
                        "id_state"  : "active",
                        "dt"        : str(rrr[1]) or '',
                        "owner"     : "",
                        "count"     : ''
                    }
                    r['data'].append(rr)
                r['count'] = '' if len(r['data']) == 0 else len(r['data'])
                _return.append(r)
            t3 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "time": (t1, t3), "total": count, "start": start_p, 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIsId(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select max(r.id) from issue r"""
            opt = ()
            res = self.db.request({"sql": sql, "options": opt})[0][0]
            if res:
                t = int(res) + 1
            else:
                t = 1

            ret = {"result": True, "ret_val": t}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIs(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = f"""select r.id, r.c_issue
from issue r
join spr_issue s on (cast(s.id_is as integer) = r.id) 
where s.id_spr = {'?' if not self._pg else '%s'}"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {
                        "c_issue"   : row_b[1],
                        "id"         : row_b[0]
                        }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTg(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = f"""select classifier.nm_group, classifier.cd_group
from CLASSIFIER 
inner join GROUPS on (groups.cd_group = classifier.cd_group) 
where ( classifier.idx_group = 7 and groups.cd_code = {'?' if not self._pg else '%s'} )"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {
                        "c_tgroup"   : row_b[0],
                        "id"         : row_b[1]
                        }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = f"""select r.barcode , r.ch_date from spr_barcode r where r.id_spr = {'?' if not self._pg else '%s'}"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {
                        "barcode"   : row_b[0],
                        "dt"        : str(row_b[1]) or '',
                        }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            if barcode and id_spr:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select id_spr from spr_barcode where id_spr = {'?' if not self._pg else '%s'} and barcode = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (id_spr, barcode)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            if id_spr and barcode:
                sql = f"""delete from spr_barcode where id_spr = {'?' if not self._pg else '%s'} and barcode = {'?' if not self._pg else '%s'}"""
                opt = (id_spr, barcode)
                result = self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": "updated"}
            elif barcode:
                sql = f"""delete from spr_barcode where barcode = {'?' if not self._pg else '%s'}"""
                opt = (barcode,)
                result = self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr or barcode"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setIssueSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            issue = params.get("issue")
            issue = issue.split('; ')
            if len(issue) > 1 and isinstance(issue, list):
                issue.pop()
            if id_spr:
                opt_i = []
                for i in issue:
                    t = (id_spr, i)
                    if i:
                        opt_i.append(t)
                sql = f"""delete from spr_issue where id_spr = {'?' if not self._pg else '%s'}"""
                opt = (id_spr, )
                result = self.db.execute({"sql": sql, "options": opt})
                if len(opt_i) > 0:
                    sql = f"""INSERT INTO spr_issue (id_spr, id_is) VALUES ({'?' if not self._pg else '%s'}, (select id from ISSUE where c_issue = {'?' if not self._pg else '%s'}))"""
                    result = self.db.executemany({"sql": sql, "options": opt_i})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            barcode = barcode.split()
            if id_spr:
                opt_i = []
                for i in barcode:
                    t = (id_spr, i)
                    opt_i.append(t)
                sql = f"""delete from spr_barcode where id_spr = {'?' if not self._pg else '%s'}"""
                opt = (id_spr, )
                result = self.db.execute({"sql": sql, "options": opt})
                if len(opt_i) > 0:
                    sql = f"""INSERT INTO spr_barcode (id_spr, barcode) VALUES ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}) RETURNING id_spr"""
                    result = self.db.executemany({"sql": sql, "options": opt_i})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkDv1(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select act_ingr from dv where act_ingr = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (act_ingr,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setDv1(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = f"""INSERT INTO dv (act_ingr, flag) VALUES (upper({'?' if not self._pg else '%s'}), 1) RETURNING id"""
                opt = (act_ingr,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                _return ={
                    "id"        : result,
                    "act_ingr"   : act_ingr
                    }
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no new name"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkZavod(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_zavod = params.get("c_zavod")
            if c_zavod:
                sql = f"""SELECT 
    CASE 
    WHEN not EXISTS(select c_zavod from spr_zavod where c_zavod = {'?' if not self._pg else '%s'}) THEN 0
    ELSE 1
    END
FROM RDB$DATABASE"""
                opt = (c_zavod,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setZavod(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_zavod = params.get("c_zavod")
            if c_zavod:
                sql = f"""INSERT INTO spr_zavod (c_zavod, flag) VALUES (upper({'?' if not self._pg else '%s'}), 1) RETURNING id_spr"""
                opt = (c_zavod,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                _return ={
                    "id"        : result,
                    "c_zavod"   : c_zavod
                    }
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no new name"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setRazbr(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            user = params.get('user')
            sh_prc = params.get('sh_prc')
            series = params.get('series')
            razbr = params.get('razbr')
            if user and sh_prc and series:
                sql = f"""update brak set razbrak = {razbr} where sh_prc = '{sh_prc}' and series = '{series}';"""
                self.db.execute({"sql": sql, "options": ()})
                _return = 'OK'
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "value error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setBrakMail(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            user = params.get("user")
            item  = params.get("item")
            letter_id = item.get("id")
            sh_prc = item.get("sh_prc")
            title = item.get("name") #"title"
            title_torg = item.get("t_name") #"title_torg"
            series = item.get("series") #"seriya"
            fabricator = item.get("vendor") #"fabricator"
            region = item.get("region", "") #"region"
            n_rec = item.get("number", "") #n_rec"
            gv = item.get("gv", "") #"gv"
            title_doc = item.get("n_doc") #"title_doc"
            opis = item.get("desc", "") #"opis"
            f_name = item.get("f_name") or str(uuid.uuid1()) #"link_file"
            ins = '?' if not self._pg else '%s'
            opt = (title, title_torg, series, fabricator, region, n_rec, gv, title_doc, opis, sh_prc, f_name)
            if letter_id == 99999999:
                sql = f"""insert into BRAK_MAIL (title, title_torg, seriya, fabricator, region, n_rec, gv, title_doc, opis, sh_prc, link_file, dt, dt_edit ) 
values ({ins}, {ins}, {ins}, {ins}, {ins}, {ins}, {ins}, {ins}, {ins}, {ins}, {ins},  current_timestamp, current_timestamp) returning id;"""
            else:
                sql = f"""update BRAK_MAIL set title = {ins}, title_torg = {ins}, seriya = {ins}, fabricator = {ins}, region = {ins}, 
n_rec = {ins}, dt_edit = current_timestamp, gv = {ins}, title_doc = {ins}, opis = {ins}, sh_prc = {ins}, link_file = {ins} 
where id = {ins} returning id;"""
                opt = opt + (letter_id,)
            res = self.db.execute({"sql": sql, "options": opt})
            print(res)
            _return = 'OK'
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delBrakMail(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            user = params.get("user")
            letter_id = params.get("id")
            ins = '?' if not self._pg else '%s'
            sql = f"""update BRAK_MAIL set deleted = 1 where id = {ins};"""
            opt = (letter_id,)
            res = self.db.execute({"sql": sql, "options": opt})
            print("del mail")
            print(params)
            pass
            _return = 'OK'
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBrakMail(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            series = params.get('series','')
            sh_prc = params.get('sh_prc', '')
            sql = f"""select sh_prc, title, title_torg, seriya, fabricator, region, n_rec, dt_edit, gv, title_doc, opis, link_file, id, dt from brak_mail
where sh_prc = '{sh_prc}' and seriya = '{series}' and deleted != 1
order by id asc;"""
            res = self.db.request({"sql": sql, "options": ()})
            _return = []
            for row in res:
                r = {
                    "sh_prc": row[0],
                    "name": row[1], #"title"
                    "t_name": row[2], #"title_torg"
                    "series": row[3], #"seriya"
                    "vendor": row[4], #"fabricator"
                    "region": row[5], #"region"
                    "number": row[6], #n_rec"
                    "ch_dt": str(row[7]), #"dt_edit"
                    "gv": row[8], #"gv"
                    "n_doc": row[9], #"title_doc"
                    "desc": row[10], #"opis"
                    "f_name": row[11], #"link_file"
                    "id": row[12], #"id"
                    "cre_date": str(row[13]), #"dt"
                    "letter": """<p>йцуйа каыуа</p>\n<p>авфауц</p>"""
                    }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBrakSearch(self, params=None, x_hash=None):
        st_t = time.time()
        names = {"c_name": "t1.c_tovar",
                 "sh_prc": "t1.sh_prc",
                 "c_zavod": "t1.c_zavod",
                 "series": "t2.series",
                 "dt": "t2.DT",
                 "razbr": "t2.RAZBRAK"}
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p -1
            series = params.get('series','')
            name = params.get('search', '')
            field = params.get('field')
            field = names.get(field, "t1.c_tovar")
            direction = params.get('direction', 'asc')
            filt = params.get("c_filter")
            ssss = []
            if filt:
                pars = {}
                dt = filt.get('dt')

                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """and (cast(t2.DT as timestamp) > CAST('{0}' as TIMESTAMP) AND cast(t2.DT as timestamp) < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """and (cast(t2.DT as timestamp) > CAST('{0}' as TIMESTAMP) AND cast(t2.DT as timestamp) < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ssss.append(s.format(pars['start_dt']))
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """and (cast(t2.DT as timestamp) >= cast('{0}' as timestamp) AND cast(t2.DT as timestamp) <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """and (cast(t2.DT as timestamp) >= cast('{0}' as timestamp) AND cast(t2.DT as timestamp) <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ssss.append(s.format(pars['start_dt'], pars['end_dt']))
            sql = """select t1.sh_prc, t1.id_spr, t1.c_tovar, t1.c_zavod, t2.series, t2.RAZBRAK, t2.DT from brak t2
join lnk t1 on ( t1.sh_prc = t2.sh_prc and t1.ID_VND = 10000)
WHERE lower(t1.C_TOVAR) like lower('%s') and lower(t2.series) like lower('%s') """ % ( f"%{name}%", f"%{series}%" )
            sql = sql + " " + " ".join(ssss)
            sql_c = f"""select count(*) from ({sql}) as sc"""
            order = f""" ORDER by {field} {direction}"""
            sql = sql + order
            sql = sql + self._insLimit(start_p, end_p)
            p_list = [{'sql': sql, 'opt': ()}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            _return = []
            for row in results[0]:
                r = {
                    "sh_prc":  row[0],
                    "c_name": row[2],
                    "c_zavod": row[3],
                    "series": row[4],
                    "razbr": row[5],
                    "dt": row[6]
                }
                _return.append(r)
            count = results[1][0][0]
            t1 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, "time": (t1), 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprSearch(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            filt = params.get('c_filter')
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p -1
            field = params.get('field', 'c_tovar')
            field = field.replace('id_zavod', 'z.c_zavod')
            field = field.replace('c_tovar', 'r.c_tovar')
            field = field.replace('id_spr', 'r.id_spr')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "lower(r.C_TOVAR) like lower('%%')"
            zavod = []
            exclude, search_re = self._form_exclude(search_re)
            if '+' in search_re:
                search_re, search_zavod = search_re.split('+')
                zavod = (search_zavod,)
            search_re = search_re.split()
            stri = [] if len(search_re) > 0 else [sti,]
            for i in range(len(search_re)):
                ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            if len(zavod) > 0:
                for i in range(len(zavod)):
                    ts2 = "lower(z.C_ZAVOD) like lower('%" + zavod[i].strip() + "%')"
                    stri.append('and %s' % ts2)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                    stri.append('and %s' % ts3)
            stri = ' '.join(stri)
            if filt:
                pars = {}
                pars['id_spr'] = filt.get('id_spr')
                pars['c_dv'] = filt.get('c_dv')
                ssss = []
                if pars['id_spr']:
                    s = "and cast(r.id_spr as varchar(32)) like ('" + pars['id_spr'] + "%')"
                    ssss.append(s)
                stri += ' ' + ' '.join(ssss)
            stri = stri.replace("lower(z.C_ZAVOD) like lower('%%%%') and", '')
            sql_c = """SELECT count(*)
FROM SPR r
{0}
{1}
WHERE {2}
            """.format("LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)" if "z.C_ZAVOD" in stri else '',
            "join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars['c_dv']) if pars['c_dv'] else "", stri)
            sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            sql = f"""SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr, nds, uhran, sezon, mandat, presc
FROM SPR r
LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)
LEFT OUTER join spr_strana s on (r.ID_STRANA = s.ID_SPR)
{"join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars['c_dv']) if pars['c_dv'] else "LEFT OUTER join dv d on (r.ID_DV = d.ID)"}
LEFT OUTER join 
    (select g.CD_CODE cc, g.CD_GROUP cg, c.NM_GROUP gr
    from GROUPS g
    inner join CLASSIFIER c on (g.CD_GROUP = c.CD_GROUP) where c.IDX_GROUP = 1
    ) as rrr1 on (r.ID_SPR = cc)
LEFT OUTER join 
    (select g1.CD_CODE cc1, g1.CD_GROUP cg1, c1.NM_GROUP nds
    from GROUPS g1
    inner join CLASSIFIER c1 on (g1.CD_GROUP = c1.CD_GROUP) where c1.IDX_GROUP = 2
    ) as rrr2 on (r.ID_SPR = cc1)
LEFT OUTER join 
    (select g2.CD_CODE cc2, g2.CD_GROUP cg2, c2.NM_GROUP uhran
    from GROUPS g2
    inner join CLASSIFIER c2 on (g2.CD_GROUP = c2.CD_GROUP) where c2.IDX_GROUP = 3
    ) as rrr3 on (r.ID_SPR = cc2)
LEFT OUTER join 
    (select g3.CD_CODE cc3, g3.CD_GROUP cg3, c3.NM_GROUP sezon
    from GROUPS g3
    inner join CLASSIFIER c3 on (g3.CD_GROUP = c3.CD_GROUP) where c3.IDX_GROUP = 6
    ) as rrr4 on (r.ID_SPR = cc3)
LEFT OUTER join 
    (select g4.CD_CODE cc4, g4.CD_GROUP cg4, c4.NM_GROUP mandat
    from GROUPS g4
    inner join CLASSIFIER c4 on (g4.CD_GROUP = c4.CD_GROUP) where c4.IDX_GROUP = 4
    ) as rrr5 on (r.ID_SPR = cc4)
LEFT OUTER join 
    (select g5.CD_CODE cc5, g5.CD_GROUP cg5, c5.NM_GROUP presc
    from GROUPS g5
    inner join CLASSIFIER c5 on (g5.CD_GROUP = c5.CD_GROUP) where c5.IDX_GROUP = 5
    ) as rrr6 on (r.ID_SPR = cc5)
WHERE {stri} ORDER by {field} {direction}
"""
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            if len(ssss) > 1:
                sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%')", '')
                sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%')", '')
            t1 = time.time() - st_t
            opt = ()
            _return = []
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            st_t = time.time()
            for row in result:
                r = {
                    "id_spr"        : row[0],
                    "c_tovar"       : row[1],
                    "id_dv"         : row[2],
                    "id_zavod"      : row[3],
                    "id_strana"     : row[4],
                    "c_dv"          : row[5],
                    "c_group"       : row[6],
                    "c_nds"         : row[7],
                    "c_hran"        : row[8],
                    "c_sezon"       : row[9],
                    "c_mandat"      : row[10],
                    "c_prescr"      : row[11],
                }
                _return.append(r)
            t2 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, "time": (t1, t2), 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprSearchAdm(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            filt = params.get('c_filter')
            in_st = []
            in_c = []
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = [] if len(search_re) > 0 else ["lower(r.C_TOVAR) like lower('%%')",]
            for i in range(len(search_re)):
                ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                    stri.append('and %s' % ts3)
            stri = ' '.join(stri)
            if filt:
                pars = {}
                pars['id_spr'] = filt.get('id_spr')
                pars['id_zavod'] = filt.get('id_zavod')
                pars['id_strana'] = filt.get('id_strana')
                pars['c_dv'] = filt.get('c_dv')
                pars['c_group'] = filt.get('c_group')
                pars['c_nds'] = filt.get('c_nds')
                pars['c_hran'] = filt.get('c_hran')
                pars['c_sezon'] = filt.get('c_sezon')
                pars['mandat'] = filt.get('mandat')
                pars['prescr'] = filt.get('prescr')
                dt = filt.get('dt')
                ssss = []
                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """and (r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """and (r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ssss.append(s.format(pars['start_dt']))
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """and (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """and (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ssss.append(s.format(pars['start_dt'], pars['end_dt']))
                if pars['id_spr']:
                    s = "and cast(r.id_spr as varchar(32)) like ('" + pars['id_spr'] + "%')"
                    ssss.append(s)
                if pars['id_zavod']:
                    s = "join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD) and z.ID_SPR = {0}".format(pars['id_zavod'])
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = "LEFT join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)"
                    in_st.append(s)
                if pars['id_strana']:
                    s = "join spr_strana s on (s.ID_SPR = r.ID_STRANA) and s.ID_SPR = {0}".format(pars['id_strana'])
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = "LEFT join spr_strana s on (s.ID_SPR = r.ID_STRANA)"
                    in_st.append(s)
                if pars['c_dv']:
                    s = "join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars['c_dv'])
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = "LEFT join dv d on (d.ID = r.ID_DV)"
                    in_st.append(s)
                if pars['c_hran']:
                    s = """join 
                    (select g2.CD_CODE cc2, c2.NM_GROUP uhran
                    from GROUPS g2
                    inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3 and c2.CD_GROUP = '%s'
                    ) as eee1 on (cc2 = r.ID_SPR)""" % pars['c_hran']
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = """LEFT join 
                    (select g2.CD_CODE cc2, c2.NM_GROUP uhran
                    from GROUPS g2
                    inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3
                    ) as eee2 on (cc2 = r.ID_SPR)"""
                    in_st.append(s)
                if pars['mandat']:
                    if (pars['mandat']) == 1:
                        s = """INNER join 
                            (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                            from GROUPS g4
                            inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                            ) as eee3  on (cc4 = r.ID_SPR) and mandat is not null"""
                        in_c.insert(0, s)
                        in_st.insert(0, s)
                    else:
                        s = """left join 
                            (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                            from GROUPS g4
                            inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                            ) as eeee1 on (cc4 = r.ID_SPR)"""
                        in_c.append(s)
                        in_st.append(s)
                        ssss.append(" and mandat is null")
                else:
                    s = """left join 
                        (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                        from GROUPS g4
                        inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                        ) as eee4 on (cc4 = r.ID_SPR)"""
                    in_st.append(s)
                if pars['prescr']:
                    if (pars['prescr']) == 1:
                        s = f"""INNER join 
                            (select g5.CD_CODE cc5, c5.NM_GROUP presc
                            from GROUPS g5
                            inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                            ) as eee5 on (cc5 = r.ID_SPR) and presc is not null"""
                        in_c.insert(0, s)
                        in_st.insert(0, s)
                    else:
                        s = """left join 
                            (select g5.CD_CODE cc5, c5.NM_GROUP presc
                            from GROUPS g5
                            inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                            ) as eee6 on (cc5 = r.ID_SPR)"""
                        in_c.append(s)
                        in_st.append(s)
                        ssss.append(" and presc is null")
                else:
                    s = """left join 
                        (select g5.CD_CODE cc5, c5.NM_GROUP presc
                        from GROUPS g5
                        inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                        ) as eee7 on (cc5 = r.ID_SPR)"""
                    in_st.append(s)
                if pars['c_group']:
                    s = """join 
                    (select g.CD_CODE cc, c.NM_GROUP gr
                    from GROUPS g
                    inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1 and c.CD_GROUP = '%s'
                    ) as eee8 on (cc = r.ID_SPR)""" % pars['c_group']
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = """LEFT join 
                    (select g.CD_CODE cc, c.NM_GROUP gr
                    from GROUPS g
                    inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1
                    ) as eee9 on (cc = r.ID_SPR)"""
                    in_st.append(s)
                if pars['c_nds']:
                    s = """join 
                    (select g1.CD_CODE cc1, c1.NM_GROUP nds
                    from GROUPS g1
                    inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2 and c1.CD_GROUP = '%s'
                    ) as eee10 on (cc1 = r.ID_SPR)""" % pars['c_nds']
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = """LEFT join 
                    (select g1.CD_CODE cc1, c1.NM_GROUP nds
                    from GROUPS g1
                    inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2
                    ) as eee11 on (cc1 = r.ID_SPR)"""
                    in_st.append(s)
                if pars['c_sezon']:
                    s = """join 
                    (select g3.CD_CODE cc3, c3.NM_GROUP sezon
                    from GROUPS g3
                    inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6 and c3.CD_GROUP = '%s'
                    ) as eee12 on (cc3 = r.ID_SPR)""" % pars['c_sezon']
                    in_c.insert(0, s)
                    in_st.insert(0, s)
                else:
                    s = """left join 
                    (select g3.CD_CODE cc3, c3.NM_GROUP sezon
                    from GROUPS g3
                    inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6
                    ) as eee13 on (cc3 = r.ID_SPR)"""
                    in_st.append(s)
                in_st.insert(0, """SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr, nds, uhran, sezon, mandat, presc, r.DT FROM SPR r""")
                sql = '\n'.join(in_st)
                in_c.insert(0, """select count(*) from spr r""")
                sql_c = '\n'.join(in_c)
                stri += ' ' + ' '.join(ssss)
            else:
                sql = """SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr, nds, uhran, sezon, mandat, presc, r.DT
                FROM SPR r
                LEFT join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
                LEFT join spr_strana s on (s.ID_SPR = r.ID_STRANA)
                LEFT join dv d on (d.ID = r.ID_DV)
                LEFT join 
                    (select g.CD_CODE cc, c.NM_GROUP gr
                    from GROUPS g
                    inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1
                    ) as ttt1 on (cc = r.ID_SPR)
                LEFT join 
                    (select g1.CD_CODE cc1, c1.NM_GROUP nds
                    from GROUPS g1
                    inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2
                    ) as ttt2 on (cc1 = r.ID_SPR)
                LEFT join 
                    (select g2.CD_CODE cc2, c2.NM_GROUP uhran
                    from GROUPS g2
                    inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3
                    ) as ttt3 on (cc2 = r.ID_SPR)
                LEFT join 
                    (select g3.CD_CODE cc3, c3.NM_GROUP sezon
                    from GROUPS g3
                    inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6
                    ) as ttt4 on (cc3 = r.ID_SPR)
                LEFT join 
                    (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                    from GROUPS g4
                    inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                    ) as ttt5 on (cc4 = r.ID_SPR)
                LEFT join 
                    (select g5.CD_CODE cc5, c5.NM_GROUP presc
                    from GROUPS g5
                    inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                    ) as ttt6 on (cc5 = r.ID_SPR)"""
                sql_c = """SELECT count(*) FROM SPR r"""

            sql += """\nWHERE {0}
ORDER by r.{1} {2}
"""
            sql = sql + self._insLimit(start_p, end_p)
            stri = stri.replace("lower(r.C_TOVAR) like lower('%%%%') and", '')
            sql_c += """ WHERE {0}""".format(stri)
            sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            sql = sql.format(stri, field, direction)
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            t1 = time.time() - st_t
            opt = ()
            _return = []
            st_t = time.time()
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            t2 = time.time() - t1 - st_t
            for row in result:
                r = {
                    "id_spr"        : row[0],
                    "c_tovar"       : row[1],
                    "id_dv"         : row[2],
                    "id_zavod"      : row[3],
                    "id_strana"     : row[4],
                    "c_dv"          : row[5],
                    "c_group"       : row[6],
                    "c_nds"         : row[7],
                    "c_hran"        : row[8],
                    "c_sezon"       : row[9],
                    "c_mandat"      : row[10],
                    "c_prescr"      : row[11],
                    "dt"            : str(row[12])
                }
                _return.append(r)
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, "time": (t1, t2), 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = int(params.get('id_spr'))
            if id_spr:
                sql = f"""SELECT r.ID_SPR, r.C_TOVAR, r.ID_STRANA, r.ID_ZAVOD, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr, i_gr, nds, i_nds, uhran, i_uhran, sezon, i_sezon, mandat, presc, issue1
FROM SPR r
LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)
LEFT OUTER join spr_strana s on (r.ID_STRANA = s.ID_SPR)
LEFT OUTER join dv d on (r.ID_DV = d.ID)
LEFT OUTER join 
    (select g.CD_CODE cc, g.CD_GROUP cg, c.NM_GROUP gr, c.CD_group i_gr
    from GROUPS g
    inner join CLASSIFIER c on (g.CD_GROUP = c.CD_GROUP) where c.IDX_GROUP = 1
    ) as ttt1 on (r.ID_SPR = cc)
LEFT OUTER join 
    (select g1.CD_CODE cc1, g1.CD_GROUP cg1, c1.NM_GROUP nds, c1.CD_group i_nds
    from GROUPS g1
    inner join CLASSIFIER c1 on (g1.CD_GROUP = c1.CD_GROUP) where c1.IDX_GROUP = 2
    ) as  ttt2 on (r.ID_SPR = cc1)
LEFT OUTER join 
    (select g2.CD_CODE cc2, g2.CD_GROUP cg2, c2.NM_GROUP uhran, c2.CD_GROUP i_uhran
    from GROUPS g2
    inner join CLASSIFIER c2 on (g2.CD_GROUP = c2.CD_GROUP) where c2.IDX_GROUP = 3
    ) as ttt3 on (r.ID_SPR = cc2)
LEFT OUTER join 
    (select g3.CD_CODE cc3, g3.CD_GROUP cg3, c3.NM_GROUP sezon, c3.CD_GROUP i_sezon
    from GROUPS g3
    inner join CLASSIFIER c3 on (g3.CD_GROUP = c3.CD_GROUP) where c3.IDX_GROUP = 6
    ) as ttt4 on (r.ID_SPR = cc3)
LEFT OUTER join 
    (select g4.CD_CODE cc4, g4.CD_GROUP cg4, c4.NM_GROUP mandat
    from GROUPS g4
    inner join CLASSIFIER c4 on (g4.CD_GROUP = c4.CD_GROUP) where c4.IDX_GROUP = 4
    ) as ttt5 on (r.ID_SPR = cc4)
LEFT OUTER join 
    (select g5.CD_CODE cc5, g5.CD_GROUP cg5, c5.NM_GROUP presc
    from GROUPS g5
    inner join CLASSIFIER c5 on (g5.CD_GROUP = c5.CD_GROUP) where c5.IDX_GROUP = 5
    ) as ttt6 on (r.ID_SPR = cc5)
LEFT OUTER join 
    (select g6.ID_SPR cc6, g6.ID_IS cg6, c6.C_ISSUE issue1
    from spr_issue g6
    inner join ISSUE c6 on (cast(g6.ID_IS as integer) = c6.ID)
    ) as ttt7 on (r.ID_SPR = cc6)
WHERE r.id_spr = {'?' if not self._pg else '%s'}"""
                opt = (id_spr,)
                _return = []
                result = self.db.request({"sql": sql, "options": opt})
                for row in result:
                    r = {
                        "id_spr"        : row[0],
                        "c_tovar"       : row[1],
                        "id_strana"     : row[2] or '',
                        "c_dv"          : row[7] or '',
                        "c_zavod"       : row[5] or '',
                        "c_strana"      : row[6] or '',
                        "id_zavod"      : row[3] or '',
                        "id_dv"         : row[4] or '',
                        "barcode"       : "",
                        "_prescr"       : 1 if row[17] else 0,
                        "_mandat"       : 1 if row[16] else 0,
                        "issue"         : "",
                        "sezon"         : row[14],
                        "id_sezon"      : row[15],
                        "usloviya"      : row[12],
                        "id_usloviya"   : row[13],
                        "group"         : row[8],
                        "id_group"      : row[9],
                        "id_nds"        : row[11],
                        "nds"           : row[10],
                        "c_tgroup"      : "",
                        "id_tgroup"     : ""
                    }
                    sql = f"""select r.barcode from spr_barcode r where r.id_spr = {'?' if not self._pg else '%s'}"""
                    t = self.db.request({"sql": sql, "options": opt})
                    b_code = []
                    for row_b in t:
                        b_code.append(row_b[0])
                    r['barcode'] = " ".join(b_code)
                    sql = f"""select s.C_ISSUE 
from SPR_ISSUE r 
JOIN ISSUE s on s.ID = cast(r.ID_IS as integer)
where r.id_spr ={'?' if not self._pg else '%s'}"""
                    t = self.db.request({"sql": sql, "options": opt})
                    b_code = []
                    for row_b in t:
                        b_code.append(row_b[0])
                    r['issue'] = "; ".join(b_code) + ('; ' if len(t) > 1 else '')
                    sql = f"""select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups
inner join classifier on (groups.cd_group = classifier.cd_group)
where ( classifier.idx_group = 7 and groups.cd_code = {'?' if not self._pg else '%s'} )"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        c_t = []
                        for row_g in t:
                            c_t.append(row_g[0])
                        r['c_tgroup'] = "; ".join(c_t)
                    except:
                        pass
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "id_spr error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprLnks(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            direction = params.get('direction', 'asc')
            s_field = None
            s_direction = None
            if field == 'c_vnd' or field == 'id_tovar':
                s_field = field
                s_direction = direction
                field = 'c_tovar'
                direction = 'asc'
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "lower(r.C_TOVAR) like lower('%%')"
            filt = params.get('c_filter')
            pref = 'and %s'
            stri_1 = ""
            ins_ch_date = None
            if filt:
                pars = {}
                pars['c_vnd'] = filt.get('c_vnd')
                pars['c_zavod'] = filt.get('c_zavod')
                pars['c_tovar'] = filt.get('c_tovar')
                pars['owner'] = filt.get('owner')
                dt = filt.get('dt')
                ssss = []
                s_1  = []
                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'])
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'], pars['end_dt'])
                if pars['c_vnd']:
                    s = "v.ID_VND = {0}".format(pars['c_vnd'])
                    ssss.append(pref % s)
                if pars['owner']:
                    s = "lower(r.owner) like lower('%" + pars['owner'] + "%')"
                    ssss.append(pref % s)
                if pars['c_tovar']:
                    s = "lower(r.C_TOVAR) like lower('%" + pars['c_tovar'] + "%')"
                    ssss.append(pref % s)
                if pars['c_zavod']:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars['c_zavod'] + "%')"
                    s1 = "lower(z.C_ZAVOD) like lower('%" + pars['c_zavod'] + "%')"
                    s_1.append(pref % s1)
                    ssss.append(pref % s)
                stri_1 = ' '.join(ssss)
                s_1 = ' '.join(s_1)
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = [] if len(search_re) > 0 else [sti,]
            for i in range(len(search_re)):
                ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                    stri.append('and %s' % ts3)
            stri = ' '.join(stri) + ' ' + s_1
            stri = stri.replace("lower(r.C_TOVAR) like lower('%%%%') and","")
            sql = """select r.id_spr, r.c_tovar, z.c_zavod, s.c_strana
from spr r
LEFT join spr_strana s on (s.ID_SPR = r.ID_STRANA)
LEFT join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
WHERE {0} 
order by r.{1} {2}
""".format(stri, field, direction)
            if ins_ch_date:
                sql = "select * from (" + sql + ins_ch_date
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            t1 = time.time() - st_t
            opt = ()
            _return = []
            st_t = time.time()
            self.log(sql, clear=True)
            self.log(sql_c, clear=True)
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            for row in result:
                st1 = ' | '.join([str(row[0]), row[1]])
                r = {
                    "id"          : row[0],
                    "$row"        : "c_tovar",
                    "open"        : False,
                    "c_tovar"     :  st1 if row[2] is None else ' | '.join([st1, row[2]]),
                    "data"        : []
                }
                if s_field == 'c_vnd':
                    orderby = 'order by v.{0} {1}'.format(s_field, s_direction)
                elif s_field == 'id_tovar':
                    orderby = 'order by r.{0} {1}'.format(s_field, s_direction)
                else:
                    orderby = 'order by r.C_TOVAR ASC'
                sql = f"""SELECT r.SH_PRC, v.C_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.OWNER,
    CASE 
    WHEN r.CHANGE_DT is null THEN r.DT
    ELSE r.CHANGE_DT
    END as ch_date
FROM LNK r 
LEFT JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.ID_SPR = {'?' if not self._pg else '%s'}"""
                sql += """ {0} {1}""".format(stri_1, orderby)
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "id"        : rrr[0],
                        "c_vnd"     : rrr[1],
                        "id_tovar"  : rrr[2],
                        "c_tovar"   : rrr[3],
                        "c_zavod"   : rrr[4],
                        "dt"        : str(rrr[6]),
                        "owner"     : rrr[5],
                        "count"     : ''
                    }
                    r['data'].append(rr)
                r['count'] = '' if len(r['data']) == 0 else len(r['data'])
                _return.append(r)
            t3 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "time": (t1, t3), "total": count, "start": start_p, "params": params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLnkSprs(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            user = params.get('user')
            start_p = int(params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p - 1
            field = params.get('field', 'c_tovar')
            if field == 'dt':
                field = 'ch_date'
            else:
                field = 'r.' + field
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = """lower(r.C_TOVAR) like lower('%%')"""
            filt = params.get('c_filter')
            search_re = search_re.split()
            stri = [] if len(search_re) > 0 else [sti,]
            for i in range(len(search_re)):
                ts1 = f"""lower(r.C_TOVAR) like lower('%{search_re[i].strip()}%')"""
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            in_st = []
            ssss = []
            ins_ch_date = None
            stri = ' '.join(stri)
            if filt:
                pars = {}
                pars['c_vnd'] = filt.get('c_vnd')
                pars['c_zavod'] = filt.get('c_zavod')
                pars['c_tovar'] = filt.get('c_tovar')
                pars['owner'] = filt.get('owner')
                pars['spr'] = filt.get('spr')
                pars['id_tovar'] = filt.get('id_tovar')
                pars['id_spr'] = filt.get('id_spr')
                pars['hash'] = filt.get('id')
                pars['source'] = filt.get('source')
                try:
                    pars['id_spr'] = int(pars['id_spr'])
                except:
                    pars['id_spr'] = None
                if not pars['owner']:
                    sql = f"""SELECT r.ID_ROLE FROM USERS r WHERE r."USER" = {'?' if not self._pg else '%s'}"""
                    opt = (user,)
                    id_role = self.db.request({"sql": sql, "options": opt})[0][0]
                    if id_role not in (10, 34):
                        pars['owner'] = user
                dt = filt.get('dt')
                if dt:
                    pars['start_dt'] = dt.get('start')
                    pars['end_dt'] = dt.get('end')
                    if pars['start_dt'] and not pars['end_dt']:
                        pars['start_dt'] = pars['start_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < DATEADD(DAY, 1, CAST('{0}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'])
                    elif pars['start_dt'] and pars['end_dt']:
                        pars['end_dt'] = pars['end_dt'].split()[0]
                        if self._pg:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        else:
                            s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= DATEADD(DAY, 1, CAST('{1}' as TIMESTAMP)))"""
                        ins_ch_date = ') as foo where %s' % s.format(pars['start_dt'], pars['end_dt'])
                if pars['c_tovar']:
                    s = f"""lower(r.C_TOVAR) like lower('%{pars['c_tovar']}%')"""
                    ssss.append('and %s' % s)
                if pars['id_spr']:
                    s = "r.id_spr like '" + str(pars['id_spr']) + "%'"
                    ssss.append('and %s' % s)
                if pars['id_tovar']:
                    s = "r.ID_TOVAR STARTING with '%s'" % pars['id_tovar']
                    ssss.append('and %s' % s)
                if pars['owner']:
                    s = f"""lower(r.OWNER) like lower('%{pars['owner']}%')"""
                    ssss.append('and %s' % s)
                if pars['c_zavod']:
                    s = f"""lower(r.C_ZAVOD) like lower('%{pars['c_zavod']}%')"""
                    ssss.append('and %s' % s)
                if pars['hash']:
                    s = "r.SH_PRC = '%s'" % pars['hash']
                    ssss.append('and %s' % s)
                if pars['source']:
                    if 0 == int(pars['source']):
                        s = "r.SOURCE is null or r.SOURCE = 0"
                    else:
                        s = "r.SOURCE = " + pars['source']
                    ssss.append('and %s' % s)
                if pars['spr']:
                    qwe = pars.get('spr')
                    exclude, qwe = self._form_exclude(qwe)
                    qwe = qwe.split()
                    sq = []
                    if len(exclude) > 0:
                        for i in range(len(qwe)):
                            s = f""" and lower(s.C_TOVAR) like lower('%{qwe[i].strip()}%')"""
                            sq.append('and %s' % s)
                        for i in range(len(exclude)):
                            s = " and lower(s.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                            sq.append(s)
                        sq_s = "JOIN SPR s on (s.ID_SPR = rids) " + ' '.join(sq) + "\nleft join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"
                        in_st.append(sq_s)
                    else:
                        for i in range(len(qwe)):
                            s = f"""lower(s.C_TOVAR) like lower('%{qwe[i].strip()}%')"""
                            sq.append('and %s' % s)
                        sq_s = "JOIN SPR s on (s.ID_SPR = rids) " + ' '.join(sq) + "\nleft join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"
                        in_st.insert(0, sq_s)
                else:
                    s = """left JOIN SPR s on (s.ID_SPR = rids)
left join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"""
                    in_st.append(s)
                if pars['c_vnd']:
                    s = f"""JOIN VND v on (v.ID_VND = ridv) and v.ID_VND = {pars['c_vnd']}"""
                    in_st.insert(0, s)
                else:
                    s = "left JOIN VND v on (v.ID_VND = ridv)"
                    in_st.append(s)
                in_st.insert(0, """SELECT rsh, v.C_VND, ridt, rct, rcv, rdt, ro, rchd, rids, s.C_TOVAR, ch_date, z.C_ZAVOD, rsou
from (
    SELECT r.SH_PRC rsh, r.ID_TOVAR ridt, r.C_TOVAR rct, r.C_ZAVOD rcv, r.DT rdt, r.OWNER ro, r.CHANGE_DT rchd, r.ID_SPR rids, r.ID_VND ridv,
        CASE 
        WHEN r.CHANGE_DT is null THEN r.DT
        ELSE r.CHANGE_DT
        END as ch_date,
        r.SOURCE rsou
        FROM (SELECT r.SH_PRC lsh,         
        CASE 
        WHEN r.CHANGE_DT is null THEN r.DT
        ELSE r.CHANGE_DT
        END as ch_date
        FROM LNK r {0}) as tttt
        JOIN LNK r on r.SH_PRC = lsh
    ) as rrrr""")
                sql = '\n'.join(in_st)
                stri += ' ' + ' '.join(ssss)
            else:
                sql = """SELECT rsh, v.C_VND, ridt, rct, rcv, rdt, ro, rchd, rids, s.C_TOVAR, ch_date, z.C_ZAVOD, rsou
from (
    SELECT r.SH_PRC rsh, r.ID_TOVAR ridt, r.C_TOVAR rct, r.C_ZAVOD rcv, r.DT rdt, r.OWNER ro, r.CHANGE_DT rchd, r.ID_SPR rids, r.ID_VND ridv,
        CASE 
        WHEN r.CHANGE_DT is null THEN r.DT
        ELSE r.CHANGE_DT
        END as ch_date,
        r.SOURCE rsou
        FROM (SELECT r.SH_PRC lsh,         
        CASE 
        WHEN r.CHANGE_DT is null THEN r.DT
        ELSE r.CHANGE_DT
        END as ch_date
        FROM LNK l {0}) as tttt1
        JOIN LNK r on r.SH_PRC = lsh
    ) as rrrr1
left JOIN VND v on (v.ID_VND = r.ID_VND)
left join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)
left JOIN SPR s on (s.ID_SPR = r.ID_SPR)"""
            sql =  sql.format("""\nWHERE {0} ORDER by {1} {2}\n""")
            sql = sql.format(stri, field, direction)
            if ins_ch_date:
                sql = "select * from (" + sql + ins_ch_date
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            stri = stri.replace("lower(r.C_TOVAR) like lower('%%') and", '')
            sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%')", '')
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%')", '')
            opt = ()
            _return = []
            p_list = [{'sql': sql, 'opt': opt}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            for row in result:
                if str(row[12]) == '1':
                    sou = "PLExpert"
                elif str(row[12]) == '2':
                    sou = "Склад"
                else:
                    sou = "Без источника"
                r = {
                    "id"          : row[0],
                    "c_vnd"       : row[1],
                    "id_tovar"    : row[2],
                    "c_tovar"     : row[3],
                    "c_zavod"     : row[4],
                    "dt"          : str(row[10]),
                    "owner"       : row[6],
                    "id_spr"      : row[8],
                    "spr"         : row[9],
                    "e_zavod"     : row[11],
                    "source"      : sou
                    }
                _return.append(r)
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, "params": params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            id_spr = params.get('id_spr')
            user = params.get('user')
            if sh_prc and id_spr:
                sql = f"""delete from PRC r WHERE r.sh_prc = {'?' if not self._pg else '%s'} returning r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.SOURCE"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})[0]
                sql = f"""insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER, SOURCE)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, CAST('NOW' AS TIMESTAMP), {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}) """
                opt = (result[0], id_spr, result[1], result[2], result[3], result[4], user, result[6])
                res = self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": result[0]}
            else:
                ret = {"result": False, "ret_val": "hash absent"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            action = params.get('action')
            user = params.get('user')
            if sh_prc and action in ('return', 'delete'):
                sql = f"""delete from lnk r WHERE sh_prc = {'?' if not self._pg else '%s'} returning r.SH_PRC, r.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.OWNER, r.SOURCE"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})[0]
                if action == 'return':
                    sql = f"""insert into PRC
(SH_PRC, ID_VND, ID_TOVAR, N_FG, N_CENA, C_TOVAR, C_ZAVOD, ID_ORG, C_INDEX, DT, IN_WORK, SOURCE)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, CAST('NOW' AS TIMESTAMP),
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'})"""
                    opt = (result[0], result[2], result[3], 0, 0, result[4], result[5], 0, 0, -1, result[8])
                else:
                    sql = f"""insert into R_LNK
(SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER, DT_R, USER_R)
values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'},
{'?' if not self._pg else '%s'},  CAST('NOW' AS TIMESTAMP),
(select ID from USERS where "USER" = {'?' if not self._pg else '%s'}) )"""
                    opt = (result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7], user)
                res = self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": result[0]}
            else:
                ret = {"result": False, "ret_val": "hash absent"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def returnLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            user = params.get('user')
            if sh_prc:
                sql = f"""update PRC set N_FG = 0, IN_WORK = -1, DT = current_timestamp where SH_PRC = {'?' if not self._pg else '%s'} returning SH_PRC, N_FG"""
                opt = (sh_prc,)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                for row in result:
                    r = {
                        "sh_prc"    : row[0]
                    }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "hash error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def skipLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            user = params.get('user')
            sql = f"""SELECT r."GROUP", r.ID FROM USERS r where r."USER" = {'?' if not self._pg else '%s'}"""
            opt = (user,)
            gr_id, user_id = self.db.request({"sql": sql, "options": opt})[0]
            iid = 1 if gr_id == 0 or gr_id == 999999 else user_id
            sss = '' if gr_id == 0 else ', id_org = 0'
            if sh_prc:
                sql = f"""update PRC set N_FG = {'?' if not self._pg else '%s'} {sss}, IN_WORK = -1 where SH_PRC = {'?' if not self._pg else '%s'} returning SH_PRC, N_FG"""
                opt = (iid, sh_prc)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                for row in result:
                    r = {
                        "sh_prc"    : row[0]
                    }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "hash error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getRoles(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """SELECT r.ID, r.NAME FROM ROLES r"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : 1 if row[0] == 0 else row[0],
                    "r_name"    : row[1],
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLinkCodes(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            data = params.get('data')
            for row in data:
                if row.get('change') == 1: #удаленная позиция
                    opt = (row.get('code'),)
                    sql = f"""delete from LNK_CODES where CODE={'?' if not self._pg else '%s'}"""
                elif row.get('change') == 50: #измененная позиция
                    opt = (row.get('process'), row.get('name'), row.get('inn'), user, row.get('code'))
                    sql = f"""update LNK_CODES set PROCESS ={'?' if not self._pg else '%s'},
NAME={'?' if not self._pg else '%s'}, INN={'?' if not self._pg else '%s'}, OWNER={'?' if not self._pg else '%s'} where CODE={'?' if not self._pg else '%s'}"""
                elif row.get('change') == 2: #новая позиция или измененная позиция
                    opt = (row.get('process'), row.get('name'), row.get('code'), row.get('inn'), user)
                    if self._pg:
                        opt = opt + opt
                        sql = """insert into LNK_CODES (PROCESS, NAME, CODE, INN, OWNER) values (%s, %s, %s, %s, %s)
ON CONFLICT (CODE) DO UPDATE 
  SET PROCESS = %s, NAME = %s, CODE = %s, INN = %s, OWNER = %s;"""
                    else:
                        sql = f"""update or insert into LNK_CODES (PROCESS, NAME, CODE, INN, OWNER)
values (?, ?, ?, ?, ?) matching (CODE)"""
                self.db.execute({"sql": sql, "options": opt})
            ret = json.loads(self.getLinkCodes(params, x_hash))
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkCodes(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """SELECT r.PROCESS, r.CODE, r.NAME, r.INN, r.OWNER FROM LNK_CODES r ORDER BY r.CODE"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "process"  : row[0],
                    "code"     : row[1],
                    "name"     : row[2],
                    "inn"      : row[3],
                    "owner"    : row[4]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLinkExcludes(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            data = params.get('data')
            for row in data:
                if row.get('change') == 1: #удаленная позиция
                    sql = f"""delete from LNK_EXCLUDES where NAME={'?' if not self._pg else '%s'}"""
                    opt = (row.get('name'),)
                elif row.get('change') == 2: #новая позиция или измененная позиция
                    opt_start = row.get('options_st')
                    opt_in = row.get('options_in')
                    if opt_start == True:
                        opt_start = 1
                    elif opt_start == False:
                        opt_start = 0
                    if opt_in == True:
                        opt_in = 1
                    elif opt_in == False:
                        opt_in = 0
                    process = row.get('process')
                    if process == True:
                        process = 1
                    elif process == False:
                        process = 0
                    opt_txt = str(opt_start) + str(opt_in)
                    opt = (process, row.get('name'), opt_txt , user)
                    if self._pg:
                        sql = """insert into LNK_EXCLUDES (PROCESS, NAME, OPTIONS, OWNER)
values (%s, %s, %s, %s) ON CONFLICT (NAME) DO UPDATE
SET (PROCESS, NAME, OPTIONS, OWNER) = (%s, %s, %s, %s);"""
                        opt = opt + opt
                    else:
                        sql = f"""update or insert into LNK_EXCLUDES (PROCESS, NAME, OPTIONS, OWNER)
values (?, ?, ?, ?)
matching (NAME)"""
                self.db.execute({"sql": sql, "options": opt})
            ret = json.loads(self.getLinkExcludes(params, x_hash))
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkExcludes(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """SELECT r.PROCESS, r.NAME, r.OPTIONS, r.OWNER FROM LNK_EXCLUDES r order by r.NAME"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "process"   : True if row[0] else False,
                    "name"      : row[1],
                    "options_st": True if int(row[2][0]) else False,
                    "options_in": True if int(row[2][1]) else False,
                    "owner"     : row[3]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            old_spr = params.get('old_spr')
            new_spr = params.get('new_spr')
            user = params.get('user')
            if old_spr and new_spr:
                result = None
                result1 = None
                sql = f"""select r.BARCODE from SPR_BARCODE r where r.ID_SPR = {'?' if not self._pg else '%s'}"""
                opt = (old_spr,)
                result = self.db.request({"sql": sql, "options": opt})
                if result:
                    for row in result:
                        sql = f"""insert into SPR_BARCODE (ID_SPR, BARCODE) values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'})"""
                        opt = (new_spr, row[0])
                        res = self.db.execute({"sql": sql, "options": opt})
                    sql = f"""delete from SPR_BARCODE where ID_SPR = {'?' if not self._pg else '%s'}"""
                    opt = (old_spr,)
                    res = self.db.execute({"sql": sql, "options": opt})
                sql = f"""update LNK set ID_SPR = {'?' if not self._pg else '%s'} where ID_SPR = {'?' if not self._pg else '%s'}"""
                opt = (new_spr, old_spr)
                result = self.db.execute({"sql": sql, "options": opt})
                sql = f"""delete from SPR where ID_SPR = {'?' if not self._pg else '%s'} returning ID_SPR"""
                opt = (old_spr,)
                result1 = self.db.execute({"sql": sql, "options": opt})
                if result1:
                    ret = {"result": True, "ret_val": old_spr}
                else:
                    ret = {"result": False, "ret_val": "not deleted"}
            else:
                ret = {"result": False, "ret_val": "no id_sprs"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def uploadBrak(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            f_name = params.get("filename")
            data = params.get("data")
            f_data = data.split(b'\r\n')
            f_data = f_data[4:-6]
            #f_data = b'\r\n'.join([i.strip() for i in f_data])
            f_data = b'\r\n'.join([i for i in f_data])
            try:
                f_data = f_data.decode()
            except:
                pass
            if f_name:
                with open(os.path.join("/ms71/temp", f_name), "w") as f_obj:
                    f_obj.write(f_data)
            #print("-"*20)
            #print(f_data)
            ret = {"result": True, "ret_val": f_name}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def saveData(self, params=None, x_hash=None):
        methods = {"__dt":"getSprSearch", #spr_dt
                   "_files": "getTasks", #adm-linker-files
                   "__dt_a": "getPrcsAll", #unlinkedall-bar
                   "_hran": "getHranAll", #adm-hran
                   "_vendors": "getVendorsAll", #adm-vendors
                   "_roles":"getAdmRoles", #adm_roles
                   "_seasons":"getSeasonAll", #adm-seasons
                   "_groups":"getGroupAll", #adm-groups
                   "_codes":"getLinkCodes", #adm-linker-codes
                   "_dv":"getDvAll", #adm-dv
                   "_country":"getStranaAll", #adm-country
                   "_excldes":"getLinkExcludes", #adm-linker-excludes
                   "_ttl":"getLnkSprs", #links_form_lnk
                   "_users":"getUsersAll", #adm-users
                   "__dt_s":"getPrcsSkip", #skiped_bar
                   "_nds":"getNdsAll", #adm-nds
                   "__dt_as":"getSprSearchAdm", #adm-spr
                   "_issues":"getIssueAll", #adm-issues
                   "__tt":"getSprLnks", #links_form_spr
                   "__dtdb": "getBarsSpr", #adm-barcodes-b
                   "__dtd": "getSprBars", #adm-barcodes-s
        }
        if self._check(x_hash):
            user = params.get("user")
            s_params = params.get('s_params')
            f_type = params.get('type', 'csv')
            headers = params.get('headers')
            c_filt = s_params.get('c_filt')
            sep = params.get('c_sep')
            search = params.get('search', "энап")
            if not sep:
                sep = params.get('sep')
            if sep == 'Табуляция':
                sep = "\t"
            method = methods.get(params.get('table'))
            params = {"user":user, "search": search, "start": 1, "count": 100000000, "c_filter": c_filt}
            call = getattr(self, method)
            data = json.loads(call(params, x_hash)).get('ret_val')
            if data:
                output_data = []
                if not isinstance(data, list):
                    data = data.get('datas')
                for item in data:
                    keys = item.keys()
                    re = {}
                    for k in keys:
                        hh = None
                        for h in headers:
                             hh = h.get(k)
                             if hh:
                                 break
                        if hh:
                            re[hh] = item.get(k)
                    output_data.append(re)
                if f_type == 'xlsx':
                    out_data = self._genXlsx(output_data)
                elif f_type == 'csv':
                    out_data = self._genCsv(output_data, sep)
                elif f_type == 'ods':
                    out_data = self._genOds(output_data)
                if out_data:
                    ret = {"result": True, "ret_val": {'type': f_type, 'data': out_data}}
                else:
                    ret = {"result": False, "ret_val": "no data"}
            else:
                ret = {"result": False, "ret_val": "error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return ret

    def _genOds(self, data):
        ret = None
        if len(data) > 0:
            ret = ods.Calc('report')
            rows = []
            keys = list(data[0].keys())
            rows.append(keys)
            for item in data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                rows.append(c_string)
            j = 0
            max_widths = {}
            while rows:
                row = rows.pop(0)
                for i in range(len(row)):
                    data = row[i]
                    l = len(str(data))
                    if j == 0:
                        max_widths[i] = l
                    if max_widths[i] < l:
                        max_widths[i] = l
                    if j == 0:
                        ret.set_cell_property('bold', True)
                    else:
                        ret.set_cell_property('bold', False)
                    ret.set_cell_property('fontsize', '8')
                    ret.set_cell_value(i+1, j+1, "string", data)
                j += 1
            for i in max_widths:
                ret.set_column_property(i+1, 'width', f"{max_widths[i]*2.4}mm")
            ret_object = BytesIO()
            ret.save(ret_object)
            data = ret_object.getvalue()
            ret_object.close()
        return data

    def _genCsv(self, output_data, sep):
        out_data = None
        if len(output_data) > 0:
            out_data = []
            keys = output_data[0].keys()
            out_data.append('\t'.join(keys))
            for item in output_data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                out_data.append('\t'.join(c_string))
            out_data = '\n'.join(out_data)
            out_data = out_data.replace('\t', sep)
        return out_data.encode()
        
    def _genXlsx(self, data):
        ret_object = BytesIO()
        ret_data = None
        properties = {
            'title':    'report',
            'category': 'Utility',
        }
        x = 6.5
        workbook = xlsx.Workbook(ret_object, {'in_memory': True})
        workbook.set_properties(properties)
        cell_format = {}
        cell_format['header'] = workbook.add_format({'font_size': '8', 'bold': True, 'align': 'center', 'bottom': 1})
        cell_format['row'] = workbook.add_format({'font_size': '8', 'align': 'left'})
        if len(data) > 0:
            rows = []
            keys = list(data[0].keys())
            rows.append(keys)
            for item in data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                rows.append(c_string)
            worksheet = workbook.add_worksheet('report')
            worksheet.set_print_scale(100)
            j = 0
            max_widths = {}
            while rows:
                row = rows.pop(0)
                for i in range(len(row)):
                    data = row[i]
                    l = len(str(data))
                    if j == 0:
                        max_widths[i] = l
                    if max_widths[i] < l:
                        max_widths[i] = l
                worksheet.write_row(j, 0, row, cell_format['header' if j==0 else 'row'])
                j += 1
            for i in max_widths:
                worksheet.set_column(i, i, max_widths[i]*(x if max_widths[i] > 10 else 9))
            worksheet.set_paper(9) #размер А4
            worksheet.set_portrait() #портретная ориентация
            worksheet.set_margins(left=1, right=0.5, top=0.5, bottom=0.5)
            workbook.close()
            ret_data = ret_object.getvalue()
            ret_object.close()
        return ret_data

    def _make_sql(self, params):
        sql = params.get('sql')
        opt = params.get('opt')
        res = self.db.request({"sql": sql, "options": opt})
        return res

    def _form_exclude(self, search_re):
        exclude = []
        for i in range(search_re.count('!')):
            ns = search_re.find('!')
            ne = search_re.find(' ', ns)
            te = search_re[ns+1: ne if ne > 0 else None]
            exclude.append(te)
            search_re = search_re.replace("!" + te, '')
        return exclude, search_re

    def _check(self, x_hash):
        #проверка валидности ключа
        ret = False
        if x_hash:
            f_name = os.path.join(self.p_path, x_hash)
            if os.path.exists(f_name):
                ret = True
        return ret


    def _insGr(self, params, result):
        prescr = params.get("prescr")
        mandat = params.get("mandat")
        id_sezon = params.get("id_sezon")
        id_usloviya = params.get("id_usloviya")
        id_group = params.get("id_group")
        id_nds = params.get("id_nds")
        c_tgroup = params.get("c_tgroup")
        c_tgroup = c_tgroup.split('; ')
        sql = f"""insert into GROUPS (CD_CODE, CD_GROUP) values ({'?' if not self._pg else '%s'}, {'?' if not self._pg else '%s'})"""
        opt = []
        for i in range(len(c_tgroup)):
            c_tgroup[i] = c_tgroup[i].strip()
            if len(c_tgroup[i]) < 1:
                c_tgroup.pop(i)
        stri = ', '.join(["'" + q + "'" for q in c_tgroup]) if len(c_tgroup) > 0 else "''"
        sq = "SELECT r.CD_GROUP FROM CLASSIFIER r WHERE r.IDX_GROUP = 7 AND r.NM_GROUP in (%s)" % stri
        tt = self.db.execute({"sql": sq, "options": ()})
        for id_tgroup in tt:
            opt.append((result, id_tgroup[0]))
        if id_group:
            opt.append((result, id_group))
        if id_nds:
            opt.append((result, id_nds))
        if id_usloviya:
            opt.append((result, id_usloviya))
        if mandat:
            opt.append((result, 'ZakMedCtg.15'))
        if prescr:
            opt.append((result, 'ZakMedCtg.16'))
        if id_sezon:
            opt.append((result, id_sezon))
        if len(opt) > 0:
            t1 = self.db.executemany({"sql": sql, "options": opt})

    def _insLimit(self, start_p, end_p):
        if self._pg:
            rrr = f""" limit {end_p - start_p + 1} offset {start_p-1}"""
        else:
            rrr = f""" ROWS {start_p} to {end_p}"""
        return rrr

    def _setUnwork(self, user):
        sql = f"""UPDATE PRC SET IN_WORK = -1 
where IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = {'?' if not self._pg else '%s'})"""
        opt = (user,)
        self.db.execute({"sql": sql, "options": opt})
        return 1

###########applied sqls
"""
update roles set NAME = 'Суперадмин' where id = 34 returning name
update roles set NAME = 'Сводильщик' where id = 9 returning name


ALTER TABLE PRC ADD 
IN_WORK Integer NOT NULL;
COMMIT;
UPDATE PRC 
SET IN_WORK = '-1' 
WHERE IN_WORK IS NULL;
commit;

create ASC 
INDEX IDX_ID_WORK on PRC 
(IN_WORK);
COMMIT;

CREATE TABLE R_LNK
(
  SH_PRC TSTR32 NOT NULL,
  ID_SPR TINT32,
  ID_VND TINT32,
  ID_TOVAR TSTR32,
  C_TOVAR TSTR255,
  C_ZAVOD TSTR255,
  DT TDATETIME,
  OWNER TSTR255,
  DT_R TDATETIME,
  USER_R TINT32,
  CONSTRAINT PK_R_LNK PRIMARY KEY (SH_PRC)
);
commit;

CREATE INDEX R_LNK_IDX1 ON R_LNK (ID_SPR);
CREATE INDEX R_LNK_IDX2 ON R_LNK (ID_VND,ID_TOVAR);
CREATE DESCENDING INDEX R_LNK_IDX3 ON R_LNK (DT);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON R_LNK TO  SYSDBA WITH GRANT OPTION;
commit;

CREATE INDEX IDX_SPR_ZAVOD1 ON SPR_ZAVOD (C_ZAVOD);
CREATE INDEX IDX_DV1 ON DV (ACT_INGR);
commit;

ALTER TABLE LNK ADD CHANGE_DT Timestamp;
ALTER TABLE PRC ADD CHANGE_DT Timestamp;
commit;

SET TERM ^ ;
ALTER TRIGGER LNK_BI0 ACTIVE
BEFORE INSERT POSITION 0
AS
begin
  if (new.dt is Null) then
    new.dt = current_timestamp;
    new.CHANGE_DT = current_timestamp;
  new.newflag = 1;
end^
SET TERM ; ^
commit;

SET TERM ^ ;
ALTER TRIGGER PRC_BI0 ACTIVE
BEFORE INSERT POSITION 0
AS
begin
  new.dt = current_timestamp;
  new.CHANGE_DT = current_timestamp;
end^
SET TERM ; ^
commit;

SET TERM ^;
CREATE TRIGGER LNK_BU FOR LNK
ACTIVE BEFORE UPDATE POSITION 0
AS
BEGIN
    new.CHANGE_DT = current_timestamp;
END^
SET TERM ;^
commit;

SET TERM ^;
CREATE TRIGGER PRC_BU FOR PRC
ACTIVE BEFORE UPDATE POSITION 0
AS
BEGIN
    new.CHANGE_DT = current_timestamp;
END^
SET TERM ;^
commit;

CREATE INDEX IDX_LNK1 ON LNK
  (C_TOVAR);
CREATE DESCENDING INDEX IDX_LNK2 ON LNK
  (C_TOVAR);
CREATE DESCENDING INDEX IDX_LNK3 ON LNK
  (CHANGE_DT);
commit;

SET TERM ^ ;
ALTER TRIGGER PRC_BU ACTIVE
BEFORE UPDATE POSITION 0
AS
BEGIN
    if (new.SH_PRC != old.SH_PRC or new.ID_VND != old.ID_VND or new.ID_TOVAR != old.ID_TOVAR or new.N_FG != old.N_FG or new.N_CENA != old.N_CENA or
        new.C_TOVAR != old.C_TOVAR or new.C_ZAVOD != old.C_ZAVOD or new.ID_ORG != old.ID_ORG or new.C_INDEX != old.C_INDEX or new.DT != old.DT) 
    THEN new.CHANGE_DT = current_timestamp;
END^
SET TERM ; ^

SET TERM ^ ;
ALTER TRIGGER LNK_BI0 ACTIVE
BEFORE INSERT POSITION 0
AS
begin
  new.CHANGE_DT = current_timestamp;
  new.newflag = 1;
  if (new.dt is Null) then new.dt = current_timestamp;
end^
SET TERM ; ^

ALTER TABLE SPR_BARCODE ADD 
CH_DATE Timestamp;

SET TERM ^;
CREATE TRIGGER SPR_BARCODE_BI FOR SPR_BARCODE
ACTIVE BEFORE INSERT POSITION 0
AS
BEGIN
    new.CH_DATE = CURRENT_TIMESTAMP;
END^
SET TERM ;^
commit;

CREATE TABLE SPR_ROLES
(
  ID_ROLE INTEGER,
  SKIPPED SMALLINT DEFAULT 0 NOT NULL,
  SPRADD SMALLINT DEFAULT 0 NOT NULL,
  SPREDIT SMALLINT DEFAULT 0 NOT NULL,
  ADM SMALLINT DEFAULT 0 NOT NULL,
  VENDORADD SMALLINT DEFAULT 0 NOT NULL,
  USERADD SMALLINT DEFAULT 0 NOT NULL,
  USERDEL SMALLINT DEFAULT 0 NOT NULL,
  LNKDEL SMALLINT DEFAULT 0 NOT NULL
);
CREATE UNIQUE INDEX SPR_ROLES_IDX1 ON SPR_ROLES (ID_ROLE);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON SPR_ROLES TO  SYSDBA WITH GRANT OPTION;
commit;

INSERT INTO SPR_ROLES (ID_ROLE, SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0);
INSERT INTO SPR_ROLES (ID_ROLE, SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL) VALUES (9, 1, 0, 0, 0, 0, 0, 0, 0);
INSERT INTO SPR_ROLES (ID_ROLE, SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL) VALUES (10, 1, 1, 1, 1, 1, 0, 0, 1);
INSERT INTO SPR_ROLES (ID_ROLE, SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL) VALUES (34, 1, 1, 1, 1, 1, 1, 1, 1);
INSERT INTO SPR_ROLES (ID_ROLE, SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL) VALUES (35, 1, 1, 1, 1, 1, 1, 1, 1);

ALTER TABLE PRC ADD SOURCE Smallint;

CREATE INDEX IDX_SPR1 ON SPR
  (C_TOVAR);
CREATE DESCENDING INDEX IDX_SPR2 ON SPR
  (C_TOVAR);
commit;
ALTER TABLE SPR_ROLES ADD N_ROLE Varchar(256)
update SPR_ROLES s set s.N_ROLE = 'user' where s.ID_ROLE = 0;
UPDATE SPR_ROLES s SET s.N_ROLE = 'linker' where s.ID_ROLE = 9;
UPDATE SPR_ROLES s SET s.N_ROLE = 'admin' where s.ID_ROLE = 10;
UPDATE SPR_ROLES s SET s.N_ROLE = 'superadmin' where s.ID_ROLE = 34;
UPDATE SPR_ROLES s SET s.N_ROLE = 'qqq' where s.ID_ROLE = 35;

CREATE TABLE A_TEMP_PRC
(
  SH_PRC TSTR32 NOT NULL COLLATE WIN1251, 
  ID_VND TINT32, 
  ID_TOVAR TSTR32, 
  N_CENA TINT32, 
  C_TOVAR TSTR255 COLLATE WIN1251, 
  C_ZAVOD TSTR255 COLLATE WIN1251, 
  ID_ORG TINT32 DEFAULT 0 NOT NULL, 
  SOURCE SMALLINT, 
  BARCODE VARCHAR(255), 
  CONSTRAINT T_PK_PRC PRIMARY KEY (SH_PRC)
);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON A_TEMP_PRC TO  SYSDBA WITH GRANT OPTION;
 
CREATE INDEX IDX_SPR_BARCODE1 ON SPR_BARCODE (BARCODE);

CREATE TABLE LNK_CODES
(
  PROCESS SMALLINT DEFAULT 0 NOT NULL,
  CODE INTEGER NOT NULL,
  NAME VARCHAR(255) NOT NULL,
  INN VARCHAR(255),
  OWNER VARCHAR(255) NOT NULL

);

GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON LNK_CODES TO  SYSDBA WITH GRANT OPTION;
commit;

CREATE TABLE LNK_EXCLUDES
(
  PROCESS SMALLINT DEFAULT 0 NOT NULL,
  NAME VARCHAR(255) NOT NULL,
  OPTIONS VARCHAR(255) DEFAULT '01' NOT NULL,
  OWNER VARCHAR(255) NOT NULL

);

GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON LNK_EXCLUDES TO  SYSDBA WITH GRANT OPTION;

commit;

ALTER TABLE PRC ADD UIN Varchar(255);
commit;
ALTER TABLE A_TEMP_PRC ADD UIN Varchar(255);
commit;
CREATE INDEX IDX_PRC1 ON PRC (UIN);
commit;

CREATE TABLE PRC_TASKS
(
  UIN VARCHAR(255) NOT NULL COLLATE WIN1251,
  SOURCE SMALLINT,
  CALLBACK VARCHAR(255) COLLATE WIN1251,
  DT TDATETIME,
  CONSTRAINT T_PK_TASKS PRIMARY KEY (UIN)
);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON PRC_TASKS TO SYSDBA WITH GRANT OPTION;
commit;

CREATE TABLE ISSUE
(
  ID TINT32 NOT NULL,
  C_ISSUE TSTR255 NOT NULL,
  FLAG SMALLINT,
  CONSTRAINT PK_ISSUE PRIMARY KEY (ID)
);
CREATE INDEX IDX_IS1 ON ISSUE (c_ISSUE);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON ISSUE TO  SYSDBA WITH GRANT OPTION;
commit;

CREATE TABLE SPR_ISSUE
(
  ID_SPR TINT32 NOT NULL,
  ID_IS TSTR32 NOT NULL
);
CREATE UNIQUE INDEX IS_IDX1 ON SPR_ISSUE (ID_SPR,ID_IS);
CREATE UNIQUE INDEX IS_IDX2 ON SPR_ISSUE (ID_IS,ID_SPR);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON SPR_ISSUE TO  SYSDBA WITH GRANT OPTION;
commit;

ALTER TABLE LNK ADD 
SOURCE Smallint

"""
