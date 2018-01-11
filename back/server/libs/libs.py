#coding: utf-8

import os
import sys
import glob
import json
import time
import uuid
import fcntl
import errno
import socket
import hashlib
import threading
import traceback
import subprocess
from urllib.parse import unquote
from libs.lockfile import LockWait
import psycopg2
import asterisk_a.ami as ami
import zlib
from io import BytesIO
from libs.connect import fb_local

"""
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

CREATE INDEX R_LNK_IDX1 ON R_LNK (ID_SPR);
CREATE INDEX R_LNK_IDX2 ON R_LNK (ID_VND,ID_TOVAR);
CREATE DESCENDING INDEX R_LNK_IDX3 ON R_LNK (DT);
GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON R_LNK TO  SYSDBA WITH GRANT OPTION;


"""

class API:
    """
    API class for http access to reloader
    x_hash - API key
    """

    def __init__(self, Lock, log, w_path = '/ms71/data/crm', p_path='/ms71/keys'):
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        self.lock = Lock
        self.exec = sys.executable
        self.log = log
        self.db = fb_local(self.log)
        self.start = 1
        self.count = 20


    def _check(self, x_hash):
        #проверка валидности ключа
        ret = False
        if x_hash:
            ret = True
        return ret

    def getVersion(self, params=None, x_hash=None):
        user = params.get('user')
        if self._check(x_hash):
            ret = {"result": True, "ret_val": self.log.version}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsSkip(self, params=None, x_hash=None):
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            end_p = int(params.get('count', self.count)) + start_p
            start_p = 1 if start_p == 0 else start_p
            search_re = params.get('search')
            user = params.get('user')
            stri = ""
            if search_re:
                search_re = search_re.replace("'", "").replace('"', "")
                t1 = search_re.strip()
                if len(t1) > 0:
                    exclude = []
                    for i in range(search_re.count('!')):
                        ns = search_re.find('!')
                        ne = search_re.find(' ', ns)
                        te = search_re[ns+1: ne if ne > 0 else None]
                        exclude.append(te)
                        search_re = search_re.replace("!" + te, '')
                    search_re = search_re.split()
                    stri = []
                    for i in range(len(search_re)):
                        ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                        stri.append('and %s' % ts1)
                    if len(exclude) > 0:
                        for i in range(len(exclude)):
                            ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                            stri.append('and %s' % ts3)
                    stri = ' '.join(stri)
            sql = """select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX
            from prc r
            inner join USERS u on (u."GROUP" = r.ID_ORG)
            WHERE r.n_fg = 1 and u."USER" = ? %s
            ROWS ? to ?
            """ % stri
            opt = (user, start_p, end_p)
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
                    "c_index" : row[8]
                }
                _return.append(r)
            sql = """select count(*)
                from prc r
                inner join USERS u on (u."GROUP" = r.ID_ORG)
                WHERE r.n_fg = 1 and u."USER" = ? %s
                """ % stri
            opt = (user,)
            tot = self.db.request({"sql": sql, "options": opt})[0][0]
            ret = {"result": True, "ret_val": _return, "total": tot, "start": start_p}
        else:
            ret = {"result": False, "ret_val": "access denied"}

        return json.dumps(ret, ensure_ascii=False)

    def getSupplUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """select r1, v.C_VND, r2 from (
                select p.ID_VND as r1, count(p.ID_VND) as r2 from PRC p 
                inner join USERS u on (u."GROUP" = p.ID_ORG)
                WHERE p.N_FG <> 1 and u."USER" = ?
                GROUP BY p.ID_VND
                )
            inner join VND v on (v.ID_VND = r1)
            order by v.C_VND ASC
            """
            opt = (user,)
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

    def getPrcs(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            id_vnd = params.get('id_vnd')
            user = params.get('user')
            #сбрасываем все настройки в работе - заплатка, пока нет функции харт-бита в приложении
            sql = """UPDATE PRC r
            SET r.IN_WORK = -1
            where r.IN_WORK = (select u."GROUP" from USERS u where u."USER" = ?)
            """
            opt = (user,)
            res = self.db.execute({"sql": sql, "options": opt})
            t1 = time.time() - st_t
            sql = """select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX
            from prc r
            inner join USERS u on (u."GROUP" = r.ID_ORG)
            WHERE r.id_vnd = ? and r.n_fg <> 1 and u."USER" = ? and r.IN_WORK = -1
            ROWS 1 to 20
            """
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
                #ins = tuple(in_work)
                sql = """UPDATE PRC r
                    SET r.IN_WORK = (SELECT u."GROUP" FROM USERS u WHERE u."USER" = ?)
                    where r.SH_PRC in (%s)""" %(', '.join([f'\'{q}\'' for q in in_work]))
                opt = (user,)
                res = self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getStranaAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = "select c_strana, id_spr from spr_strana where flag=1 order by c_strana"
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

    def getVendorAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = "select c_zavod, id_spr from spr_zavod where flag=1 order by c_zavod"
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

    def getDvAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = "select r.ID, r.ACT_INGR from dv r where r.flag=1 order by r.ACT_INGR"
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[0],
                    "act_ingr"       : row[1]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
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
                sql = """select count(*)
                from classifier 
                where classifier.cd_group = ?
                """
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
                sql = """insert into classifier (cd_group, nm_group, IDX_GROUP)
                values (?, ?, 3) returning cd_group"""
                opt = (c_id, val)
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

    def delHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get('id')
            if c_id:
                sql = """delete from classifier where cd_group = ? returning cd_group"""
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
                sql = """update classifier set nm_group = ? where cd_group = ? returning cd_group"""
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

    def _insGr(self, params, result):
        prescr = params.get("prescr");
        mandat = params.get("mandat");
        id_sezon = params.get("id_sezon");
        id_usloviya = params.get("id_usloviya");
        id_group = params.get("id_group");
        id_nds = params.get("id_nds");
        sql = """insert into GROUPS (CD_CODE, CD_GROUP) values (?, ?)"""
        opt = []
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

    def setSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr");
            barcode = params.get("barcode");
            c_tovar = params.get("c_tovar");
            id_strana = params.get("id_strana");
            id_zavod = params.get("id_zavod");
            id_dv = params.get("id_dv");
            c_opisanie = params.get("c_opisanie");

            user = params.get("user");
            sh_prc = params.get("sh_prc");
            _return = []
            if id_spr > 0:
                sql = """update SPR set C_TOVAR = ?, DT = CAST('NOW' AS TIMESTAMP),
                ID_DV = ?, ID_ZAVOD = ?, ID_STRANA = ?, C_OPISANIE = ? where ID_SPR = ?"""
                opt = (c_tovar, id_dv, id_zavod, id_strana, c_opisanie, id_spr)
                res = self.db.execute({"sql": sql, "options": opt})
                sql = """delete FROM GROUPS as g
                         WHERE g.CD_GROUP in 
                             (SELECT c.CD_GROUP
                             FROM CLASSIFIER as c
                             WHERE c.IDX_GROUP in (1, 2, 3, 4, 5, 6)
                             )
                         and g.CD_CODE = ?"""
                opt = (id_spr,)
                t1 = self.db.execute({"sql": sql, "options": opt})
                self._insGr(params, id_spr)
                self.setBar(params, x_hash)
                ret = id_spr
                new = False
            else:
                sql = """insert into SPR (C_TOVAR, DT, ID_DV, ID_ZAVOD, ID_STRANA, C_OPISANIE)
                values (?, CAST('NOW' AS TIMESTAMP), ?, ?, ?, ?) returning ID_SPR"""
                opt = (c_tovar, id_dv, id_zavod, id_strana, c_opisanie)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                if result:
                    sql = """delete from PRC where SH_PRC = ?"""
                    opt = (sh_prc,)
                    t1 = self.db.execute({"sql": sql, "options": opt})
                    self._insGr(params, result)
                    params['id_spr'] = result
                    self.setBar(params, x_hash)
                ret = result #new id_spr
                new = True
            _return.append(ret)
            ret = {"result": True, "ret_val": _return, "new": new}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)



    def getUsersAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """select r.ID, r."USER", r.PASSWD, r."GROUP", r.INN, r.ID_ROLE from users r"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id"        : row[0],
                    "c_user"    : row[1],
                    "c_pwrd"    : row[2],
                    "id_group"  : row[3],
                    "c_inn"     : row[4],
                    "id_role"   : row[5],
                    "id_state"  : "active",
                    "dt"        : "01-01-2016"
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr");
            if id_spr:
                sql = """select r.barcode from spr_barcode r where r.id_spr = ?"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {
                        "barcode"   : row_b[0]
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
            id_spr = params.get("id_spr");
            barcode = params.get("barcode");
            if barcode and id_spr:
                sql = """select count(*) from spr_barcode where id_spr = ? and barcode = ?"""
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
                sql = """delete from spr_barcode where id_spr = ?"""
                opt = (id_spr, )
                result = self.db.execute({"sql": sql, "options": opt})
                if len(opt_i) > 0:
                    sql = """INSERT INTO spr_barcode (id_spr, barcode) VALUES (?, ?) RETURNING id_spr"""
                    result = self.db.executemany({"sql": sql, "options": opt_i})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = """select count(*) from dv where act_ingr = ?"""
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

    def setDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = """INSERT INTO dv (act_ingr, flag) VALUES (upper(?), 1) RETURNING id"""
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
                sql = """select count(*) from spr_zavod where c_zavod = ?"""
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
                sql = """INSERT INTO spr_zavod (c_zavod, flag) VALUES (upper(?), 1) RETURNING id_spr"""
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

    def getSprSearch(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            end_p = int(params.get('count', self.count)) + start_p
            start_p = 1 if start_p == 0 else start_p
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "lower(r.C_TOVAR) like lower('%%')"
            zavod = []
            exclude = []
            for i in range(search_re.count('!')):
                ns = search_re.find('!')
                ne = search_re.find(' ', ns)
                te = search_re[ns+1: ne if ne > 0 else None]
                exclude.append(te)
                search_re = search_re.replace("!" + te, '')
            for i in range(search_re.count('+')):
                ns = search_re.find('+')
                ne = search_re.find(' ', ns)
                te = search_re[ns+1: ne if ne > 0 else None]
                zavod.append(te)
                search_re = search_re.replace("+" + te, '')
            search_re = search_re.split()
            stri = []
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
            stri = ' '.join(stri) if len(stri) > 0 else sti
            sql = """SELECT count(*)
                    FROM SPR r
                    inner join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
                    WHERE %s""" % stri
            opt = ()
            tot = self.db.request({"sql": sql, "options": opt})[0][0]
            sql ="""SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA
            FROM SPR r
            inner join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
            inner join spr_strana s on (s.ID_SPR = r.ID_STRANA)
            WHERE %s ORDER by r.C_TOVAR ASC ROWS ? to ?
            """ % stri
            t1 = time.time() - st_t
            opt = (start_p, end_p)
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            st_t = time.time()
            for row in result:
                r = {
                    "id_spr"        : row[0],
                    "c_tovar"       : row[1],
                    "id_dv"         : row[2],
                    "id_zavod"      : row[3],
                    "id_strana"     : row[4],
                }
                _return.append(r)
            t2 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "total": tot, "start": start_p, "time": (t1, t2)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = int(params.get('id_spr'))
            if id_spr:
                sql ="""SELECT r.ID_SPR, r.C_TOVAR, r.C_OPISANIE, r.ID_STRANA, r.ID_ZAVOD, r.ID_DV
                FROM SPR r where r.id_spr = ?
                """
                opt = (id_spr,)
                _return = []
                result = self.db.request({"sql": sql, "options": opt})
                for row in result:
                    #print(row)
                    r = {
                        "id_spr"        : row[0],
                        "c_tovar"       : row[1],
                        "c_dv"          : '',
                        "c_zavod"       : '',
                        "c_strana"      : '',
                        "c_opisanie"    : row[2],
                        "id_strana"     : row[3],
                        "id_zavod"      : row[4],
                        "id_dv"         : row[5],
                        "barcode"       : "",
                        "_prescr"       : 0,
                        "_mandat"       : 0,
                        "sezon"         : "",
                        "id_sezon"      : "",
                        "usloviya"      : "",
                        "id_usloviya"   : "",
                        "group"         : "",
                        "id_group"      : "",
                        "id_nds"        : "",
                        "nds"           : ""
                    }
                    sql = """select r.barcode from spr_barcode r where r.id_spr = ?"""
                    t = self.db.request({"sql": sql, "options": opt})
                    b_code = []
                    for row_b in t:
                        b_code.append(row_b[0])
                    r['barcode'] = " ".join(b_code)
                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 5 and groups.cd_code = ?)"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        tt = t[0][0]
                        if tt:
                            r["_prescr"] = 1
                    except:
                        pass
                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 4 and groups.cd_code = ?)"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        tt = t[0][0]
                        if tt:
                            r["_mandat"] = 1
                    except:
                        pass
                        
                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 6 and groups.cd_code = ? )"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r["sezon"] = t[0][0]
                        r["id_sezon"] = t[0][1]
                    except:
                        pass

                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 3 and groups.cd_code = ?)"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r["usloviya"] = t[0][0]
                        r["id_usloviya"] = t[0][1]
                    except:
                        pass

                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 1 and groups.cd_code = ? )"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r["group"] = t[0][0]
                        r["id_group"] = t[0][1]
                    except:
                        pass
                    
                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group
                    from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                    where ( classifier.idx_group = 2 and groups.cd_code = ? )"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r["nds"] = t[0][0]
                        r["id_nds"] = t[0][1]
                    except:
                        pass

                    sql = "select c_zavod from spr_zavod where id_spr = ? and flag = 1"
                    opt = (row[4],)
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r['c_zavod'] = t[0][0]
                    except:
                        pass
                    sql = "select c_strana from spr_strana where id_spr = ? and flag = 1"
                    opt = (row[3],)
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r['c_strana'] = t[0][0]
                    except:
                        pass
                    sql = "select ACT_INGR from dv where id = ? and flag = 1"
                    opt = (row[5],)
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        r['c_dv'] = t[0][0]
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
            end_p = int(params.get('count', self.count)) + start_p
            start_p = 1 if start_p == 0 else start_p
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "lower(r.C_TOVAR) like lower('%%')"
            exclude = []
            for i in range(search_re.count('!')):
                ns = search_re.find('!')
                ne = search_re.find(' ', ns)
                te = search_re[ns+1: ne if ne > 0 else None]
                exclude.append(te)
                search_re = search_re.replace("!" + te, '')
            search_re = search_re.split()
            stri = []
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
            stri = ' '.join(stri) if len(stri) > 0 else sti
            sql = """select count(*)
                    from spr r
                    WHERE %s 
            """ % stri
            #print(sql)
            opt = ()
            count = self.db.request({"sql": sql, "options": opt})[0][0]
            sql = """select r.id_spr, r.c_tovar, z.c_zavod, s.c_strana
                    from spr r
                    inner join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
                    inner join spr_strana s on (s.ID_SPR = r.ID_STRANA)
                    WHERE %s 
                    order by r.id_spr asc
                    ROWS ? to ?
            """ % stri
            t1 = time.time() - st_t
            opt = (start_p, end_p)
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            st_t = time.time()
            for row in result:
                st1 = ' | '.join([str(row[0]), row[1]])
                r = {
                    "id"          : row[0],
                    "$row"        : "c_tovar",
                    "open"        : False,
                    "c_tovar"     :  st1 if len(row[2]) < 1 else ' | '.join([st1, row[2]]),
                    #"c_zavod_s"   : row[2],
                    "data"        : []
                }
                sql = """SELECT r.SH_PRC, v.C_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.OWNER
                        FROM LNK r 
                        JOIN VND v on (v.ID_VND = r.ID_VND)
                        WHERE r.ID_SPR = ? order by r.C_TOVAR ASC
                """
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "id"        : rrr[0],
                        "c_vnd"     : rrr[1],
                        "id_tovar"  : rrr[2],
                        "c_tovar"   : rrr[3],
                        "c_zavod"   : rrr[4],
                        "dt"        : str(rrr[5]),
                        "owner"     : rrr[6]
                    }
                    r['data'].append(rr)
                _return.append(r)
            t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t3), "total": count, "start": start_p}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get('sh_prc')
            id_spr = params.get('id_spr')
            user = params.get('user')
            if sh_prc and id_spr:
                sql = """delete from PRC r WHERE r.sh_prc = ? returning r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})[0]

                sql = """insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
                         values (?, ?, ?, ?, ?, ?, ?, ?) """
                opt = (result[0], id_spr, result[1], result[2], result[3], result[4], result[5], user)
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
                sql = """delete from lnk r WHERE sh_prc = ? returning r.SH_PRC, r.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.OWNER"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})[0]
                if action == 'return':
                    sql = """insert into PRC
                    (SH_PRC, ID_VND, ID_TOVAR, N_FG, N_CENA, C_TOVAR, C_ZAVOD, ID_ORG, C_INDEX, DT, IN_WORK)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
                    opt = (result[0], result[2], result[3], 0, 0, result[4], result[5], 0, 0, result[6], -1)
                else:
                    sql = """insert into R_LNK
                    (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER, DT_R, USER_R)
                    values (?, ?, ?, ?, ?, ?, ?, ?, 
                    CAST('NOW' AS TIMESTAMP),
                    (select ID from USERS where "USER" = ?) )"""
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
                sql = """update PRC r set r.N_FG = 0, r.IN_WORK = -1 where r.SH_PRC = ? returning r.SH_PRC, r.N_FG"""
                opt = (sh_prc,)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                print(result)
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
            sql = """SELECT r."GROUP" FROM USERS r where r."USER" = ?"""
            opt = (user,)
            user_id = self.db.request({"sql": sql, "options": opt})[0][0]
            iid = 1 if user_id == 0 else user_id
            if sh_prc:
                sql = """update PRC r set r.N_FG = ?, r.IN_WORK = -1 where r.SH_PRC = ? returning r.SH_PRC, r.N_FG"""
                opt = (iid, sh_prc)
                print(sql)
                print(opt)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                print(result)
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



class fLock:
    """
    File locking class. Intended for use with the `with` syntax.
    """

    def __init__(self, path):
        self._path = path
        self._fd = None

    def __enter__(self):
        self._fd = os.open(self._path, os.O_CREAT)
        while True:
            try:
                fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB) # try to acquire the Lock
                return
            except (OSError, IOError) as ex:
                if ex.errno != errno.EAGAIN: # Resource temporarily unavailable
                    raise
            time.sleep(0.01)

    def __exit__(self, *args):
        fcntl.flock(self._fd, fcntl.LOCK_UN)
        os.close(self._fd)
        self._fd = None

def getip(log):
    """
    get ip's function
    """

    _urls = ('https://sklad71.org/consul/ip/', 'http://ip-address.ru/show','http://yandex.ru/internet',
        'http://ip-api.com/line/?fields=query', 'http://icanhazip.com', 'http://ipinfo.io/ip',
        'https://api.ipify.org')
    s = r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
    eip = None
    iip = ''
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as se:
            se.connect(("77.88.8.8", 80))
            iip = se.getsockname()[0]
    except Exception as e:
        log(f"err:{str(e)}")
    import ssl, re, urllib.request
    ssl._create_default_https_context = ssl._create_unverified_context
    for url in _urls:
        r = None
        data = ''
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                data = str(r.headers)
                data += r.read().decode()
                eip = re.findall(s, data)[0].strip()
                break
        except Exception as e:
            continue
    return eip, iip


class logs:
    """
    logging class
    """

    def __init__(self, hostname=None, version=None, appname=None, profile=None):
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile

    def __call__(self, msg, kind='info', begin='', end='\n'):
        try:
            ts = "%Y-%m-%d %H:%M:%S"
            try: ts = time.strftime(ts)
            except: ts = time.strftime(ts)
            if self.hostname:
                if self.profile:
                    s = '{0}{1} {2} {4}.{5}:{3}:{6} {7}{8}'.format(begin, ts, self.hostname, self.version, self.appname, self.profile, kind, msg, end)
                else:
                    s = '{0}{1} {2} {4}:{3}:{5} {6}{7}'.format(begin, ts, self.hostname, self.version, self.appname, kind, msg, end)
            else:
                if self.profile:
                    s = '{0}{1} {3}.{4}:{2}:{5} {6}{7}'.format(begin, ts, self.version, self.appname, self.profile, kind, msg, end)
                else:
                    s = '{0}{1} {3}:{2}:{4} {5}{6}'.format(begin, ts, self.version, self.appname, kind, msg, end)
            sys.stdout.write(s)
            sys.stdout.flush()
        except:
            traceback.print_exc()

class SCGIServer:
    """
    SCGI Server class
    """

    def __init__(self, log, hostname=None, version=None, appname=None, profile=None, index=None):
        self.log = log
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile
        self.index = index

    def serve_forever(self, addr, handle_request):
        sock = None
        if type(addr) is str:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        else:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(addr)
        #sock.listen(10)
        initial_value = None
        initial_value = self._init(sock)
        try:
            while True:
                _conn, _addr = sock.accept()
                _t = threading.Thread(target=self._handle_conn, args=(_conn, _addr, handle_request, initial_value))
                _t.env = None
                _t.daemon = True
                _t.start()
        finally:
            try: sock.close()
            except: pass

    def _handle_conn(self, conn, addr, handle_request, initial_value):
        env = None
        try:
            conn.settimeout(1)
            rfile = conn.makefile("rb", -1)
            wfile = conn.makefile("wb", 0)
            env = self._env_read(rfile)
            env = self._args_parse(env)
            env["scgi.defer"] = None
            env["scgi.initv"] = initial_value
            env["scgi.rfile"] = rfile
            env["scgi.wfile"] = wfile
            env["CONTENT_LENGTH"] = int(env["CONTENT_LENGTH"])
            threading.current_thread().env = env
            g = handle_request(env)
            wfile.write("Status: {0}\r\n".format(g.__next__()).encode())
            wfile.flush()
            for kv in g.__next__():
                wfile.write(": ".join(kv).encode())
                wfile.write(b"\r\n")
            wfile.write(b"\r\n")
            wfile.flush()
            for data in g:
                wfile.write(data)
                wfile.flush()
        except (BrokenPipeError) as e:
            pass
        except:
            self.log(conn)
            self.log(env)
            traceback.print_exc()
        finally:
            if not wfile.closed:
                try: wfile.flush()
                except: pass
            try: wfile.close()
            except: pass
            try: rfile.close()
            except: pass
            try: conn.shutdown(socket.SHUT_WR)
            except: pass
            try: conn.close()
            except: pass
            if env and env.get("scgi.defer"):
                try:
                    env["scgi.defer"]()
                except:
                    self.log(traceback.format_exc(), kind="error:defer")

    def _env_read(self, f):
        size, d = f.read(16).split(b':', 1)
        size = int(size)-len(d)
        if size > 0:
            s = f.read(size)
            if not s:
                raise IOError('short netstring read')
            if f.read(1) != b',':
                raise IOError('missing netstring terminator')
            items =  b"".join([d, s]).split(b'\0')[:-1]
        else:
            raise IOError('missing netstring size')
        assert len(items) % 2 == 0, "malformed headers"
        env = {}
        while items:
            v = items.pop()
            k = items.pop()
            env[k.decode()] = v.decode()
        return env

    def _args_parse(self, env):
        args = []
        argd = {}
        for x in env.pop('ARGS', '').split('&'):
            i = x.find('=')
            if i > -1:
                k, x  = x[:i], x[i+1:]
            else:
                k = None
            if k:
                argd[unquote(k)] = unquote(x)
            else:
                if x:
                    args.append(unquote(x))
        env['HTTP_PARAMS'] = args
        env['HTTP_KWARGS'] = argd
        return env

    def _init(self, sock):
        addr = sock.getsockname()[:2]
        sock.listen(100)
        sys.APPCONF["addr"] = addr
        fileupstream = self._getfilename("upstream")
        sys.APPCONF["fileupstream"] = fileupstream
        data = """

        location /linker_logic {
        #if (!-f /ms71/data/crm_login/keys/$http_x_api_key.crm) {
        #return 403;
        #}

         if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';

            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
         }
         if ($request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
         }
         
         if ($request_method = 'HEAD') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
         }


        limit_except POST HEAD OPTIONS GET{
            deny all;
        }
        include scgi_params;
        #scgi_param                X-BODY-FILE $request_body_file;
        scgi_param                X-API-KEY $http_x_api_key;
        scgi_pass                 linker_ups;
        scgi_buffering            off;
        scgi_cache                off;
    }

    location /linker {
        #if (!-f /ms71/data/crm_login/keys/$http_x_api_key.crm) {
        #return 403;
        #}
        add_header Cache_Control no-cache;
        #alias html/crm;
        #index index.html;
        try_files $uri $uri/index.html $uri.html =404;
    }
    """
        filelocation = self._getfilename("location")
        dn = os.path.dirname(filelocation)
        bs = os.path.basename(filelocation)
        _filelocation = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])  # общий файл для всех экземпляров приложения
        with open(_filelocation, "wb") as f:
            f.write(data.encode())
        sys.APPCONF["filelocation"] = _filelocation
        dn = os.path.dirname(fileupstream)
        bs = os.path.basename(fileupstream)
        _fileupstream = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])  # общий файл для всех экземпляров приложения
        _fileupstreamlock = bs.split('.', 1)[0].split('-', 1)[0]  # _fileupstream + '.lock'
        data1 = """upstream linker_ups {
        least_conn;
        server %s:%s;  # %s
    }
    """ % (addr[0], addr[1], bs)
        data2 = """#   server %s:%s;  # %s""" % (addr[0], addr[1], bs)
        with LockWait(_fileupstreamlock):
            if os.path.exists(_fileupstream):
                with open(_fileupstream, "rb") as f:
                    src = f.read().decode().rstrip().splitlines()
                    # + ' ' + data[1:] + '\n}\n'
                _find = "# %s" % bs
                # fg - пердполагаем, что надо добавлять свой апстрим
                fg = True
                for i in range(1, len(src)-1):
                    if src[i].find(_find) >-1:
                        fg = False
                        src[i] = ' ' + data2[1:]
                        break
                if fg:
                    src[len(src)-1] = ' ' + data2[1:] + '\n}\n'
                src = '\n'.join(src)
                with open(_fileupstream, "wb") as f:
                    f.write(src.encode())
            else:
                with open(_fileupstream, "wb") as f:
                    f.write(data1.encode())
        rc = 0
        rc = subprocess.call(['sudo', 'nginx', '-t', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
                             #stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if 0 == rc:
            rc = subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
            if 0 == rc:
                self.log("%s:%s running" % addr)
                return [addr, os.getpid()]
        raise SystemExit(rc)

    def _getfilename(self, name):
        filename = ""
        if self.index > -1:
            if self.profile:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s-%s.%s" % (self.appname, self.index, self.profile))
            else:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s-%s" % (self.appname, self.index))
        else:
            if self.profile:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s.%s" % (self.appname, self.profile))
            else:
                filename = os.path.join(sys.APPCONF["nginx"][name], self.appname)
        return filename

def head(aContentLength, fgDeflate=True, fg_head=True):
    """
    make a header of response function
    """

    aLastModified = time.strftime('%a, %d %b %Y %X GMT', time.gmtime())
    r = []
    r.append(("Last-Modified", "%s" % aLastModified))
    r.append(("Content-Length", "%i" % aContentLength))
    r.append(("X-Accel-Buffering", "no"))
    if fg_head:
        r.append(("Content-Type", "application/json"))
    else:
        r.append(("Cache-Control", "no-cache"))
        r.append(("Content-Type", "text/plain; charset=UTF-8"))
    if fgDeflate:
        r.append(("Content-Encoding", "deflate"))
    return r

def shutdown(log):
    """
    function, runs when exiting
    """

    fileupstream = sys.APPCONF.get("fileupstream")
    if fileupstream is None:
        log("%s:%s critical" % sys.APPCONF["addr"], begin='')
        return
    try:
        os.remove(fileupstream)
    except: pass
    dn = os.path.dirname(fileupstream)
    bs = os.path.basename(fileupstream)
    _fileupstream = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])
    _fileupstreamlock = bs.split('.', 1)[0].split('-', 1)[0]
    with LockWait(_fileupstreamlock):
        _find = "# %s" % bs
        src = ""
        fg_noapp = True
        if os.path.exists(_fileupstream):
            with open(_fileupstream, "rb") as f:
                src = f.read().decode().rstrip().splitlines()
            for i in range(1, len(src)-1):
                if src[i].find(_find) >-1:
                    src.pop(i)
                    break
            fg_noapp = 0 == len(src[2:-1])
        if fg_noapp:  # нет запущенных приложений, удаляем общую локацию и апстрим
            try:
                os.remove(sys.APPCONF["filelocation"])
            except: pass
            try:
                os.remove(_fileupstream)
            except: pass
        else:
            src = '\n'.join(src)
            with open(_fileupstream, "wb") as f:
                f.write(src.encode())

    subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
    log("%s:%s shutdown" % sys.APPCONF["addr"], begin='')

def _int(x):
    try:
        fx = float(x)
        ix = int(fx)
        return ix if ix == fx else fx
    except:
        return x

def parse_args(arg, _param, x_hash, api):
    try:
        call = getattr(api, arg)
    except:
        content = json.dumps(u'\'%s\' not implimented method' % arg, ensure_ascii=False)
    else:
        if x_hash:
            try:
                content = call(_param, x_hash)
            except:
                #print('-'*20)
                #print('error calling', _param, x_hash)
                print(traceback.format_exc(), flush=True)
                #print('-'*20)
                content = json.dumps(u'use \'%s\' with correct parameters' % arg, ensure_ascii=False)
        else:
            content = json.dumps(u'login please', ensure_ascii=False)
    return content

def handle_commandline(profile, index):
    args = []
    kwargs = {}
    sys.stdin.close()
    _argv = sys.argv[1:]
    for x in _argv:
        i = x.find('=')
        if i > -1:
            k, x  = x[:i], x[i+1:]
        else:
            k = None
        if k:
            v = unquote(x).split(',')
            if len(v) > 1:
                kwargs[unquote(k)] = tuple(_int(x) for x in v)
            else:
                kwargs[unquote(k)] = _int(v[0])
        else:
            if x:
                v = unquote(x).split(',')
                if len(v) > 1:
                    args.append(tuple(libs._int(x) for x in v))
                else:
                    args.append(_int(v[0]))
    if "profile" in kwargs:
        profile = kwargs.pop("profile")
    if "index" in kwargs:
        index = kwargs.pop("index")
    return args, kwargs, profile, index

def clear_keys(w_path):
    """
    remove all keys
    """

    f_list = glob.glob(f'{w_path}/*.sw')
    for f_ in f_list:
        try:
            os.remove(f_)
        except: pass


class UDPSocket(socket.socket):

    def __init__(self, bind_addr=('127.0.0.1', 0), std_addr=('127.0.0.1', 4222),
                 family=socket.AF_INET, type=socket.SOCK_DGRAM, proto=0, _sock=None):
        super(UDPSocket, self).__init__(family=family, type=type, proto=proto)
        try: self.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        except: pass
        try: self.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        except: pass
        self.bind(bind_addr)
        self._buf = []
        self._std_addr = std_addr

    def write(self, text):
        fg = False
        if isinstance(text, str):
            self._buf.append(text.encode())
            fg = text.rfind('\n') > -1
        else:
            self._buf.append(text)
            fg =  text.rfind(b'\n') > -1
        if fg:
            data = b''.join(self._buf)[:8192]
            self._buf.clear()
            return self.sendto(data, self._std_addr)

    def flush(self):
        pass

    def readlines(self):
        return self.recv(8192)

    def read(self, n=8192):
        return self.recv(n)
