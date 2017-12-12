#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
reload(sys)
sys.setdefaultencoding('utf8')


import utils, os
import cgi,urllib
import json
import datetime


mySqlHOST = "127.0.0.1"
    
ccode1 = "utf8"
ccode = "cp1251"

import logging
LOG_FILENAME = 'worklog.out'
logging.basicConfig(filename=LOG_FILENAME,level=logging.DEBUG)



class Loging:
    def add(self, task, result, user):
        return True
        import datetime
        
        logging.debug('\n\n')
        logging.debug(user + ' - start' + str(datetime.datetime.now()) )
        logging.debug('\ttask: ' + task)
        logging.debug('\tresult: ' + result)

        logging.debug(user + ' - end' + str(datetime.datetime.now()) )
        
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = "INSERT INTO LOGS (task, result, user_name) VALUES ( '%s', '%s', '%s') " % ( task, result, user)
            #dbc.execute(sql)
            #db.commit()
        except  Exception, e:
            logging.debug('Loging.add error: '+ sql+ ' - ' +str(e))
               

class invLinkTools:
    start = 0
    limit = 25
    sp_task = '' 
    type_action = 0
    query = ''
    user = ''
    specParam = ''
    
    def Login(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = """select vnd.* from vnd inner join user_vnd on (vnd.id_vnd = user_vnd.id_vnd) inner join users on (user_vnd.id_user = users.id)
                where users."USER" = '%s' and users.passwd = '%s'""" % ( sp_serch[0], sp_serch[1] )         
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
                r = { 
                    "id_vnd" : row[0],
                    "c_vnd": row[1],
                    "dt_prc": row[2],
                    "n_sum": row[3],
                    "n_sum2": row[4],
                    "n_sum3": row[5]
                }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task,"results":result}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
            
    def delBarTovar(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = "DELETE FROM SPR_BARCODE WHERE ID_SPR = %s and BARCODE = '%s'" % (sp_serch[0], sp_serch[1])
            dbc.execute(sql)
            db.commit()
            return json.dumps({"req":"%s" % self.sp_task,"results":'true'}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def addBarTovar(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = "INSERT INTO SPR_BARCODE (ID_SPR, BARCODE)\
             VALUES (%s,'%s')" % (sp_serch[0], sp_serch[1])
            dbc.execute(sql)
            db.commit()
            return json.dumps({"req":"%s" % self.sp_task,"results":'true'}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
            
    def getBarTovar(self, sp_serch):
        #sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = """select * from spr_barcode where id_spr = %s""" % (sp_serch)         
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
                r = { 
                    "id_spr" : row[0],
                    "barcode": row[1]
                }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task,"results":result}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def decodeCode(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            if len(sp_serch) < 8: sp_serch += '0000000'
            result = 'true'
            tmp = {}
            sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where classifier.idx_group = 444 and classifier.cd_group = '%s'""" % (sp_serch[0:7])
            
            dbc.execute(sql)
            
            tmp['s444'] = []
            for row in dbc.fetchall():                
                r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                tmp['s444'].append(r)
            
            
            sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where classifier.idx_group = 333 and classifier.cd_group = '%s'""" % (sp_serch[0:5])
            dbc.execute(sql)
            
            tmp['s333'] = []
            for row in dbc.fetchall():                
                r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                tmp['s333'].append(r)
            
            
            sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where classifier.idx_group = 222 and classifier.cd_group = '%s'""" % (sp_serch[0:3])
            dbc.execute(sql)
            
            tmp['s222'] = []
            for row in dbc.fetchall():                
                r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                tmp['s222'].append(r)

                
            sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where classifier.idx_group = 111 and classifier.cd_group = '%s'""" % (sp_serch[0:1])
            dbc.execute(sql)
            
            tmp['s111'] = []
            for row in dbc.fetchall():                
                r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                tmp['s111'].append(r)
            
            tmp['s000'] = []
            if len(tmp['s111']) > 0:
                sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                    from classifier where classifier.idx_group > 10 and classifier.idx_group < 100 and classifier.cd_group = '%s'""" % (tmp['s111'][0]["flag"])
                dbc.execute(sql)

                for row in dbc.fetchall():                
                    r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                    tmp['s000'].append(r)
            
            if len(tmp['s000']) == 0:
                sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                    from classifier where classifier.idx_group > 10 and classifier.idx_group < 100 and classifier.cd_group = '%s'""" % (sp_serch[0])
                dbc.execute(sql)

                for row in dbc.fetchall():                
                    r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }                            
                    tmp['s000'].append(r)
            
            return json.dumps({"req":"%s" % self.sp_task,"results":tmp,"success":"true"}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def getSprGroup(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        sql = 'error'
        query = self.query;
        query1 = ''            
        
        if self.specParam != '':            
            if self.specParam.isdigit():
                query1 = query1 + " and upper(FIRST_GROUP) like upper('%s')" % (self.specParam.encode(ccode1).upper() + '%')
            else:
                query1 = query1 + " and upper(cd_group) like upper('%s')" % (self.specParam.encode(ccode1).upper() + '%')
            
                    
        
        if query != '':
            query = "and upper(nm_group) like upper('%s')" % ('%' + query.encode(ccode1).upper() + '%')
        
        try:           
            #return query1
            sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where classifier.idx_group = %s %s %s""" % (sp_serch, query, query1)
            
            if sp_serch == 11 or sp_serch == '11': 
                sql = """select classifier.cd_group, classifier.nm_group, classifier.FIRST_GROUP
                from classifier where (classifier.idx_group = 11 or  classifier.idx_group = 22 or  classifier.idx_group = 33 or  classifier.idx_group = 44) %s %s""" % (query, query1)
            
            #return sql 
            
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
                r = { "id_spr" : row[0], "c_name": row[1], "flag": row[2] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task,"results":result}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def getSprZavodControl(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        sp_serch = sp_serch.encode(ccode)
        if str(sp_serch) == "999999":
            sp_serch = ""
        if  '%' not in sp_serch:
            sp_serch = '%' + sp_serch + '%'
        try:
            # 1
            sp_serch = "upper(spr_zavod.c_zavod) like upper('%s')" % sp_serch.upper() 
            sql = """select 
                        count(*)
                    from spr_zavod
                       inner join spr on (spr_zavod.id_spr = spr.id_zavod)
                    where %s
            """ % (sp_serch)
            dbc.execute(sql)
            count = dbc.fetchall()[0][0]
            # 2
            sql = """select first %s skip %s 
                        spr_zavod.id_spr,
                        spr_zavod.c_zavod,
                        spr.id_zavod,
                        spr.c_zavod,
                        spr.id_spr
                    from spr_zavod
                       inner join spr on (spr_zavod.id_spr = spr.id_zavod)
                    where %s order by spr.c_zavod
            """ % ( self.limit, self.start, sp_serch)
            # sql
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
                r = { "id_spr_zavod" : row[0], "name_spr_zavod": row[1], "id_spr": row[2], "name_spr": row[3], "id_sys_spr": row[4] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "total": count, "results":result}, ensure_ascii=False).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def get_name_from_code(self, sp_code):
        try:
            db = utils.conMySpr()
            dbc = db.cursor()

            # запрос к БД
            sql = """SELECT C_VND FROM VND where ID_VND = %s """ % (sp_code)
            # выполняем запрос
            dbc.execute(sql)
            cursor = dbc.fetchall()

            # получаем результат выполнения запроса
            for rec in cursor:          
                title = rec
                title = ''.join( title )
                
            return title.encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getSuppliers(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sql = 'select distinct(id_vnd) from prc'
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                tmpT = self.get_name_from_code(row[0])
                sql = "select * from prc where prc.id_vnd = %s" % row[0]
                dbc.execute(sql)
                count = dbc.fetchall()
                if tmpT == 'null' or tmpT == None or tmpT == '':
                    tmpT = str(row[0]) + ' - неопределен'
                r = {
                        "id_vnd"   : row[0],
                        "title_vnd": tmpT + ' (%s)' % str(len(count))
                     }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getLink(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            if sp_serch != '999999':
                if sp_serch.isdigit():
                    sql = "select * from prc where prc.id_vnd = %s" % sp_serch
                else:
                    sp_serch = "upper(c_tovar) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%')
                    sql = "select * from prc where %s" % sp_serch
            else:
                sql = "select * from prc"
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = {
                        "sh_prc"  : row[0],
                        "id_vnd"  : row[1],
                        "id_tovar": row[2],
                        "c_tovar" : row[5],
                        "c_zavod" : row[6],
                        "active" : 0
                     }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getSpr(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            tmp1 = sp_serch.split('+')
            tmp = tmp1[0].split(' ')
            sp_serch = ''
            s = 0
            for g in tmp:
                if s!=0:
                    sp_serch += ' and '
                else:
                    sp_serch += ' where '
                s = s+1
                #sp_serch = sp_serch + "c_tovar like upper('%s') or c_zavod like upper('%s')"\
                 #% ( '%' + g.decode('utf8').upper() + '%', '%' + g.decode('utf8').upper() + '%' )
                sp_serch = sp_serch + "upper(c_tovar) like upper('%s')"\
                 % ('%' + g.decode('utf8').upper() + '%')
            
            sp_serch1 = ''     
            if len(tmp1) > 1:
                tmp = tmp1[1].split(' ')
                s = 0
                for g in tmp:
                    sp_serch1 += ' and '
                    s = s+1
                    sp_serch1 = sp_serch1 + "upper(c_zavod) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%') 
                 
            sql = "select * from spr %s %s" % ( sp_serch, sp_serch1 )
            
            # sql
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            # f
            for row in f:            
                r = {
                        "sh_prc"  : row[0],
                        "c_tovar" : row[1],
                        "c_zavod" : '',
                        "c_strana" : '',
                        "c_opis": row[14],
                        "group": '',
                        "usloviya" : '',
                        "sezon" : '',
                        "jv" : '',
                        "bind" : '',
                        "id_zavod" : row[12],
                        "id_strana" : row[13],
                        "id_sezon" : '',
                        "id_usloviya" : '',
                        "id_group": '',
                        "id_nds": ''
                        
                }
                
                sql = """select c_zavod from spr_zavod where id_spr = %s""" % row[12]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_zavod"] = tmp[0]
                    
                sql = """select c_strana from spr_strana where id_spr = %s""" % row[13]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_strana"] = tmp[0]
                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 4 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["bind"] = tmp[0]
                    
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 5 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["jv"] = tmp[0]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 6 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                # tmp
                if tmp != None:
                    r["sezon"] = tmp[0]
                    r["id_sezon"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 3 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                # tmp
                if tmp != None:
                    r["usloviya"] = tmp[0]
                    r["id_usloviya"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 1 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                # tmp
                if tmp != None:
                    r["group"] = tmp[0]
                    r["id_group"] = tmp[1]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 2 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["id_nds"] = tmp[1]

                result.append(r)
            return json.dumps({"req":"%s" % sql, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"sql":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def setSprNaklad(self, sp_serch):
    #def setSvyaz(self, sp_serch):
        _sp_serch = sp_serch
        sp_serch = json.loads(sp_serch)
        Logs = Loging()
        #import p
        #p.p(sp_serch) 
        db = utils.conMySpr()
        dbc = db.cursor()
        #if str(sp_serch) == "999999":
        #   sp_serch = ""
        
        try:            
            sql = "INSERT INTO LNK (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD)\
             VALUES ('%s', %s, %s, '%s', '%s', '%s')" % (sp_serch['old_name']['sh_prc'],
            sp_serch['id_spr'], sp_serch['old_name']['id_vnd'], sp_serch['old_name']['id_tovar'],
            sp_serch['old_name']['c_tovar'], sp_serch['old_name']['c_zavod'])
            # sql
            dbc.execute(sql)
            
            sql = "DELETE FROM PRC WHERE SH_PRC = '%s'" % sp_serch['old_name']['sh_prc']
            # sql
            dbc.execute(sql)
            db.commit()
            Logs.add( task, 'true', self.user)
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def updateGrp(self, sprid):
        db = utils.conMySpr()
        dbc = db.cursor()
        
        sql = "select c_tovar, id_dv, c_opisanie from spr where id_spr = %s" % sprid
        dbc.execute(sql)
        tmp = dbc.fetchone()
        
        sql = "UPDATE spr SET c_tovar = '%s' WHERE ID_SPR <> ID_TOVAR and ID_TOVAR = %s" % ( tmp[0].encode(ccode), sprid )
        dbc.execute(sql)
        #db.commit()
        try:
            if tmp[1] != 0 and tmp[0] != None and tmp[0] != '':
                sql = "UPDATE spr SET id_dv = %s WHERE ID_SPR <> ID_TOVAR and ID_TOVAR = %s" % ( tmp[1], sprid )
                dbc.execute(sql)
                #db.commit()
            else:
                sql = "select id_dv from spr where ID_TOVAR = %s and id_dv <> 0 and id_dv is not null" % sprid
                dbc.execute(sql)
                tmp1 = dbc.fetchone()
                if tmp1 <> None and len(tmp1) > 0:
                    sql = "UPDATE spr SET id_dv = %s WHERE ID_TOVAR = %s" % ( tmp1[0], sprid )
                    dbc.execute(sql)
                    db.commit()
                    
            if tmp[2] != '' and tmp[2] != None:
                sql = "UPDATE spr SET c_opisanie = '%s' WHERE ID_SPR <> ID_TOVAR and ID_TOVAR = %s" % ( tmp[2], sprid )
                dbc.execute(sql)
                #db.commit()
            else:
                sql = "select c_opisanie from spr where ID_TOVAR = %s and c_opisanie <> 'None' and c_opisanie <> '' and id_dv is not null" % sprid
                dbc.execute(sql)
                tmp1 = dbc.fetchone()
               # print tmp1
                if tmp1 <> None and len(tmp1) > 0:
                    sql = "UPDATE spr SET c_opisanie = '%s' WHERE ID_TOVAR = %s" % ( tmp1[0].encode(ccode), sprid )
                    dbc.execute(sql)
                    db.commit()
                    
            db.commit()
            
            sql = "select id_spr from spr where ID_TOVAR = %s" % sprid
            dbc.execute(sql)
            f = dbc.fetchall()
            childArr = []
            for i in f:
                childArr.append(i[0])
            
            sql = """select t1.CD_GROUP, t2.idx_group from groups t1
            inner join classifier t2 on (t2.cd_group = t1.cd_group  )
            where CD_CODE = %s""" % sprid
            dbc.execute(sql)
            tmp = dbc.fetchall()                        
            artmp = []
            for rec in tmp:
                artmp.append(rec[1])
                #print rec[0], rec[1]
            
            def insertDop(val, cdcode, idx):
                
                sql = """delete from groups where CD_CODE in (
                select t1.CD_CODE from groups t1
                inner join classifier t2 on (t2.cd_group = t1.cd_group and t2.idx_group = _idx_ )
                inner join spr t3 on (t3.id_spr = t1.cd_code and t3.id_spr = _cdcode_ )
                ) and CD_GROUP in (
                select t1.CD_GROUP from groups t1
                inner join classifier t2 on (t2.cd_group = t1.cd_group and t2.idx_group = _idx_ )
                inner join spr t3 on (t3.id_spr = t1.cd_code and t3.id_spr = _cdcode_ )
                )""".replace('_cdcode_', str(cdcode)).replace('_idx_', str(idx)) 
                #print sql
                try:
                    dbc.execute(sql)
                    db.commit()
                except Exception, e:
                    return e
                    
                if val != '__clear__':
                    sql = "INSERT INTO groups (CD_GROUP, CD_CODE) VALUES ('%s', %s)" % (val, cdcode)            
                    #print sql
                    try:
                        dbc.execute(sql)
                        db.commit()
                    except Exception, e:
                        return e
            
            
            def getIdxgr(val):
                if val == '__clear__': return 4
                sql = """select idx_group from classifier where CD_GROUP = '%s'""" % val
                #print sql
                dbc.execute( sql )
                res = dbc.fetchall()
                return res[0][0]

            if 4 not in artmp:
                tmp.append(('__clear__',4))
                artmp.append(4)
            for rec in tmp:                
                for child in childArr:                              
                    if child != sprid:
                        #print rec[0], child, getIdxgr(rec[0])
                        insertDop(rec[0], child, getIdxgr(rec[0]))
            
            dopcount = 6
            
            sql = """select t1.CD_CODE, t1.CD_GROUP, t2.idx_group from groups t1
            inner join classifier t2 on (t2.cd_group = t1.cd_group and t2.idx_group = _code_ )
            inner join spr t3 on (t3.id_spr = t1.cd_code and t3.id_tovar = %s )""" % sprid
            
            for i in xrange(dopcount):
                if i+1 not in artmp and i+1 == 4:
                    pass
                if i+1 not in artmp and i+1 != 5 and i+1 != 4:
                    dbc.execute( sql.replace('_code_', str(i+1)) )
                    res = dbc.fetchall()
                    for owner in res:
                        if sprid == owner[0]: res = [] 
                    if len(res) > 0 and i+1 != 5 and i+1 != 4:
                        for child in childArr:                              
                            if child != res[0][0]:
                                insertDop(res[0][1], child, i+1)
            
        except  Exception, e:
            return e, sql
        
        
        return True
    
    def sprAddNew(self, sp_serch):
        #return 'rrr'
        sql = ''
        task = self.sp_task + " " + str(sp_serch)
        sp_serch = json.loads(sp_serch)
        Logs = Loging()
        
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            
            if sp_serch['spr'][3] == None:
                sp_serch['spr'][3] = 0
            
            if sp_serch['spr'][2] == None:
                sp_serch['spr'][2] = 0
            
            if sp_serch['spr'][1] == None:
                sp_serch['spr'][1] = 0
            
            
            sql = "INSERT INTO SPR (C_TOVAR, ID_DV, C_OPISANIE, BARCODE) VALUES ('%s', %s, '%s', '%s')  RETURNING ID_SPR" % ( sp_serch['spr'][0], sp_serch['spr'][3], sp_serch['spr'][4].replace("'","''"), sp_serch['spr'][18] )
            
            #sql = "UPDATE SPR SET C_TOVAR = '%s', ID_DV = %s, C_OPISANIE = '%s' where ID_SPR = %s" % ( sp_serch['spr'][0], sp_serch['spr'][3], sp_serch['spr'][4].replace("'","''"), sp_serch['spr'][11] )
            
            dbc.execute(sql)
            id_spr = dbc.fetchone()[0]
            
            
            def checkGroup(val, id):
                db = utils.conMySpr()
                dbc = db.cursor()
                sql = "select count(*) FROM GROUPS WHERE CD_CODE='%s' AND CD_GROUP = '%s' " % (id, val)
                dbc.execute(sql)
                tmp = dbc.fetchall()
                if tmp[0][0] > 0:
                    return True
                else:
                    return False
            
            
            if sp_serch['spr'][6] == True:
                if not checkGroup('ZakMedCtg.15',id_spr):
                    sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.15')" % id_spr
                    dbc.execute(sql)
            else:
                if checkGroup('ZakMedCtg.15',id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr,'ZakMedCtg.15')
                    dbc.execute(sql)
            
            keyarr = [7,8,9,10,12,13,14,15,16]
            for tmpkey in keyarr:
                if sp_serch['spr'][tmpkey] != None:
                    if not checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        #print 111
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][tmpkey], id_spr )
                        #print 333
                        dbc.execute(sql)
                        #print 444
                else:
                    if checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][tmpkey])
                        dbc.execute(sql)
                        
            for tmpkey in sp_serch['spr'][17]:
                if tmpkey != None:
                    if not checkGroup(tmpkey,id_spr):
                        #print 222
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( tmpkey, id_spr )
                        dbc.execute(sql)
                else:
                    if checkGroup(tmpkey,id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, tmpkey)
                        dbc.execute(sql)
                        
            #print 888
            db.commit()
            #self.updateGrp(sp_serch['spr'][11])
            Logs.add( task, 'true', self.user)
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    
    
    def sprEdit(self, sp_serch):
        #return 'rrr'
        task = self.sp_task + " " + str(sp_serch)
        sp_serch = json.loads(sp_serch)
        Logs = Loging()
        
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            
            if sp_serch['spr'][3] == None:
                sp_serch['spr'][3] = 0
            
            if sp_serch['spr'][2] == None:
                sp_serch['spr'][2] = 0
            
            if sp_serch['spr'][1] == None:
                sp_serch['spr'][1] = 0
            
            sql = "DELETE FROM GROUPS WHERE CD_CODE = %s" % sp_serch['spr'][11]
            dbc.execute(sql)
            
            
            sql = "UPDATE SPR SET C_TOVAR = '%s', ID_DV = %s, C_OPISANIE = '%s' where ID_SPR = %s" % ( sp_serch['spr'][0], sp_serch['spr'][3], sp_serch['spr'][4].replace("'","''"), sp_serch['spr'][11] )
            
            dbc.execute(sql)
            
            id_spr = sp_serch['spr'][11]
            
            def checkGroup(val, id):
                sql = "select count(*) FROM GROUPS WHERE CD_CODE='%s' AND CD_GROUP = '%s' " % (id, val)
                dbc.execute(sql)
                tmp = dbc.fetchall()
                if tmp[0][0] > 0:
                    return True
                else:
                    return False
            """
            if sp_serch['spr'][5] == True:
                if not checkGroup('ZakMedCtg.16',id_spr):
                    sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.16')" % id_spr
                    dbc.execute(sql)
            else:
                if checkGroup('ZakMedCtg.16',id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, 'ZakMedCtg.16')
                    dbc.execute(sql)
            """
            
            
            
            
            
            
            if sp_serch['spr'][6] == True:
                if not checkGroup('ZakMedCtg.15',id_spr):
                    sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.15')" % id_spr
                    dbc.execute(sql)
            else:
                if checkGroup('ZakMedCtg.15',id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr,'ZakMedCtg.15')
                    dbc.execute(sql)
            
            keyarr = [7,8,9,10,12,13,14,15,16]
            for tmpkey in keyarr:
                if sp_serch['spr'][tmpkey] != None:
                    if not checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][tmpkey], id_spr )
                        dbc.execute(sql)
                else:
                    if checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][tmpkey])
                        dbc.execute(sql)
                        
            for tmpkey in sp_serch['spr'][17]:
                if tmpkey != None:
                    if not checkGroup(tmpkey,id_spr):
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( tmpkey, id_spr )
                        dbc.execute(sql)
                else:
                    if checkGroup(tmpkey,id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, tmpkey)
                        dbc.execute(sql)
                        
            """    
            if sp_serch['spr'][8] != None:
                if not checkGroup(sp_serch['spr'][8],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][8], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][8],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][8])
                    dbc.execute(sql)
                
            if sp_serch['spr'][9] != None:
                if not checkGroup(sp_serch['spr'][9],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][9], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][9],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][9])
                    dbc.execute(sql)
            
            if sp_serch['spr'][10] != '':
                if not checkGroup(sp_serch['spr'][10],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][10], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][10],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][10])
                    dbc.execute(sql)
            
            if sp_serch['spr'][12] != None:
                if not checkGroup(sp_serch['spr'][12],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][12], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][12],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][12])
                    dbc.execute(sql)
            
            if sp_serch['spr'][13] != None:
                if not checkGroup(sp_serch['spr'][13],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][13], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][13],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][13])
                    dbc.execute(sql)
            
            if sp_serch['spr'][14] != None:
                if not checkGroup(sp_serch['spr'][14],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][14], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][14],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][14])
                    dbc.execute(sql)
                    
            if sp_serch['spr'][15] != None:
                if not checkGroup(sp_serch['spr'][15],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][15], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][15],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][15])
                    dbc.execute(sql)

            if sp_serch['spr'][16] != None:
                if not checkGroup(sp_serch['spr'][16],id_spr):
                    sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][16], id_spr )
                    dbc.execute(sql)
            else:
                if checkGroup(sp_serch['spr'][16],id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][16])
                    dbc.execute(sql)
            """
            db.commit()
            self.updateGrp(sp_serch['spr'][11])
            Logs.add( task, 'true', self.user)
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def sprEdit1(self, sp_serch):
        #return 'rrr'
        task = self.sp_task + " " + str(sp_serch)
        sp_serch = json.loads(sp_serch)
        Logs = Loging()
        
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            
            if sp_serch['spr'][3] == None:
                sp_serch['spr'][3] = 0
            
            if sp_serch['spr'][2] == None:
                sp_serch['spr'][2] = 0
            
            if sp_serch['spr'][1] == None:
                sp_serch['spr'][1] = 0
            
            sql = "DELETE FROM GROUPS WHERE CD_CODE = %s" % sp_serch['spr'][11]
            dbc.execute(sql)
            
            
            sql = "UPDATE SPR SET C_TOVAR = '%s', ID_DV = %s, C_OPISANIE = '%s' where ID_SPR = %s" % ( sp_serch['spr'][0], sp_serch['spr'][3], sp_serch['spr'][4].replace("'","''"), sp_serch['spr'][11] )
            
            dbc.execute(sql)
            
            id_spr = sp_serch['spr'][11]
            
            def checkGroup(val, id):
                sql = "select count(*) FROM GROUPS WHERE CD_CODE='%s' AND CD_GROUP = '%s' " % (id, val)
                dbc.execute(sql)
                tmp = dbc.fetchall()
                if tmp[0][0] > 0:
                    return True
                else:
                    return False
            
            
            if sp_serch['spr'][6] == True:
                if not checkGroup('ZakMedCtg.15',id_spr):
                    sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.15')" % id_spr
                    dbc.execute(sql)
            else:
                if checkGroup('ZakMedCtg.15',id_spr):
                    sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr,'ZakMedCtg.15')
                    dbc.execute(sql)
            
            keyarr = [7,8,9,10,12,13,14,15,16]
            for tmpkey in keyarr:
                if sp_serch['spr'][tmpkey] != None:
                    if not checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][tmpkey], id_spr )
                        dbc.execute(sql)
                else:
                    if checkGroup(sp_serch['spr'][tmpkey],id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, sp_serch['spr'][tmpkey])
                        dbc.execute(sql)
                        
            for tmpkey in sp_serch['spr'][17]:
                if tmpkey != None:
                    if not checkGroup(tmpkey,id_spr):
                        sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( tmpkey, id_spr )
                        dbc.execute(sql)
                else:
                    if checkGroup(tmpkey,id_spr):
                        sql = "DELETE FROM GROUPS WHERE CD_CODE = '%s' AND CD_GROUP = '%s' " % (id_spr, tmpkey)
                        dbc.execute(sql)
                        
           
            db.commit()
           
            Logs.add( task, 'true', self.user)
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    
    def addSpr(self, sp_serch):
                
        sp_serch = json.loads(sp_serch)
        
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            if sp_serch['spr'][3] == None:
                sp_serch['spr'][3] = 0
                
            sql = "INSERT INTO SPR (C_TOVAR, ID_ZAVOD, ID_STRANA, ID_DV, C_OPISANIE)\
             VALUES ('%s', %s, %s)  RETURNING ID_SPR" % ( sp_serch['spr'][0], sp_serch['spr'][2], sp_serch['spr'][1], sp_serch['spr'][3], sp_serch['spr'][4])
            
            dbc.execute(sql)
            id_spr = dbc.fetchone()[0]
            
            sql = "INSERT INTO LNK (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD)\
             VALUES ('%s', %s, %s, '%s', '%s', '%s')" % (sp_serch['lnk']['sh_prc'],
            id_spr, sp_serch['lnk']['id_vnd'], sp_serch['lnk']['id_tovar'],
            sp_serch['lnk']['c_tovar'], sp_serch['lnk']['c_zavod'])
            
            dbc.execute(sql)
            
            if sp_serch['spr'][5] == True:
                sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.16')" % id_spr
                dbc.execute(sql)
                
            if sp_serch['spr'][6] == True:
                sql = "INSERT INTO GROUPS (CD_CODE, CD_GROUP) VALUES ('%s', 'ZakMedCtg.15')" % id_spr
                dbc.execute(sql)
                
            if sp_serch['spr'][7] != None:
                sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][7], id_spr )
                dbc.execute(sql)
                
            if sp_serch['spr'][8] != None:
                sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][8], id_spr )
                dbc.execute(sql)
                
            if sp_serch['spr'][9] != None:
                sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][9], id_spr )
                dbc.execute(sql)
            
            if sp_serch['spr'][10] != '':
                sql = "INSERT INTO GROUPS ( CD_GROUP, CD_CODE ) VALUES ('%s', '%s')" % ( sp_serch['spr'][10], id_spr )
                dbc.execute(sql)
            
            sql = "DELETE FROM prc WHERE SH_PRC = '%s'" % sp_serch['lnk']['sh_prc']
            dbc.execute(sql)
            
            db.commit()
            
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getLnkStrana(self, sp_serch):
        #return sp_serch
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            if sp_serch == '999999':
                sql = "select c_strana, id_spr from spr_strana where flag is null order by c_strana"
            else:
                sp_serch = "upper(c_strana) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%') 
                sql = "select c_strana, id_spr from spr_strana where %s and flag is null order by c_strana" % (sp_serch)
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr" : row[1] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getSprStrana(self, sp_serch):
        #return sp_serch
        db = utils.conMySpr()
        dbc = db.cursor()
        #return sp_serch
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sp_serch = "upper(c_strana) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%') 
            sql = "select c_strana, id_spr, flag from spr_strana where %s  and flag=1 order by c_strana" % (sp_serch)
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1], "flag": row[2] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def addSprStrana(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            
            sql = "UPDATE spr_strana SET C_STRANA = '%s', FLAG = 1 where ID_SPR = %s" % ( sp_serch['_new'], sp_serch['_old'])
            dbc.execute(sql)
           # id_spr = sp_serch['_old']
          #  sql = "UPDATE SPR SET ID_STRANA = '%s' WHERE (ID_ZAVOD = '%s')" % ( id_spr, sp_serch['_id_link'] )
            
            dbc.execute(sql)
            
            db.commit()
            
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def setSprStrana(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            sql = "DELETE FROM SPR_STRANA WHERE ID_SPR = '%s'" % ( sp_serch['id_link'] )
            dbc.execute(sql)
           # db.commit()
            
            sql = "UPDATE SPR_STRANA SET FLAG = 1 WHERE ID_SPR = '%s'" % ( sp_serch['id_spr'] )
            dbc.execute(sql)
            
            sql = "UPDATE SPR SET ID_STRANA = '%s' WHERE (ID_STRANA = '%s')" % ( sp_serch['id_spr'], sp_serch['id_link'] )
            dbc.execute(sql)
            
            db.commit()
            
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getLnkZavod(self, sp_serch):
        #return sp_serch
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            # "getLnkZavod Run"
            if sp_serch == '999999':
                sql = "select c_zavod, id_spr from spr_zavod where flag is null order by c_zavod"
            else:
                sp_serch = "upper(c_zavod) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%') 
                sql = "select c_zavod, id_spr from spr_zavod where %s and flag is null order by c_zavod" % (sp_serch)
            
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def setEtalonZavodKod(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = "UPDATE SPR SET ID_ZAVOD = %s WHERE ID_SPR = %s" % ( sp_serch[0], sp_serch[1] )
        #    sql
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def editNameZavod(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = "UPDATE SPR_ZAVOD SET C_ZAVOD = '%s' WHERE ID_SPR = %s" % ( sp_serch[1].encode(ccode), sp_serch[0] )
            # sql
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    def getSprZavod(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        
        try:
        #    323423
            sp_serch = "upper(c_zavod) like upper('%s')" % ('%' + sp_serch.encode(ccode).upper() + '%') 
            sql = "select c_zavod, id_spr,flag from spr_zavod where %s and flag=1 order by c_zavod" % (sp_serch)
            dbc.execute(sql)
        #     sql
            result = []
            f = dbc.fetchall()
        #     11111
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1], "flag": row[2],  }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def addSprZavod(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sql = "UPDATE spr_zavod SET C_ZAVOD = '%s', FLAG = 1 where ID_SPR = %s" % ( sp_serch['_new'], sp_serch['_old'])
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def setSprZavod(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            sql = "DELETE FROM SPR_ZAVOD WHERE ID_SPR = '%s'" % ( sp_serch['id_link'] )
            dbc.execute(sql)
            db.commit()
            
            sql = "UPDATE SPR_ZAVOD SET FLAG = 1 WHERE ID_SPR = '%s'" % ( sp_serch['id_spr'] )
            dbc.execute(sql)
            
            sql = "UPDATE SPR SET ID_ZAVOD = '%s' WHERE (ID_ZAVOD = '%s')" % ( sp_serch['id_spr'], sp_serch['id_link'] )
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def getLnkSpr(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            if sp_serch == '999999':
                sql = "select c_tovar, id_spr from spr where id_tovar is null order by c_tovar"
            else:
                tmpstr = sp_serch.split()
                sp_serch = ''
                for rec in tmpstr:
                    sp_serch = "%s upper(c_tovar) like upper('%s') and " % (sp_serch, '%' + rec + '%') 
                #sp_serch = "upper(c_tovar) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%') 
                sql = "select c_tovar, id_spr from spr where %s  id_tovar is null order by c_tovar" % (sp_serch)                
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def getSprSpr(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            tmpstr = sp_serch.split()
            sp_serch = ''
            for rec in tmpstr:
                sp_serch = "%s upper(c_tovar) like upper('%s') and " % (sp_serch, '%' + rec + '%') 
            #sp_serch = "upper(c_tovar) like upper('%s')" % ('%' + sp_serch.encode(ccode).upper() + '%') 
            sql = "select c_tovar, id_spr, id_tovar from spr where %s  id_tovar = id_spr order by c_tovar" % (sp_serch)# and flag=1 
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1], "flag": row[2] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def addSprSpr(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:            
            sql = "UPDATE spr SET c_tovar = '%s', id_tovar = '%s'  WHERE id_spr = '%s'" % ( sp_serch['_new'], sp_serch['_old'], sp_serch['_old'] )
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def setSprSpr(self, sp_serch):            
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sql = "UPDATE spr SET id_tovar = '%s' WHERE id_spr = '%s'" % ( sp_serch['id_spr'], sp_serch['id_link'] )
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def getLnkDv(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            if sp_serch == '999999':
                sql = "select act_ingr, id from dv where flag is null order by act_ingr"
            else:
                sp_serch = "upper(act_ingr) like upper('%s')" % ('%' + sp_serch.decode('utf8').upper() + '%') 
                sql = "select act_ingr, id from dv where %s and flag is null order by act_ingr" % (sp_serch)
            
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1] }
                result.append(r)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def getSprDv(self, sp_serch):
        Logs = Loging()
        task = self.sp_task + " " + str(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if self.query != '':
            sp_serch = self.query
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sp_serch = "upper(act_ingr) like upper('%s')" % ('%' + sp_serch.encode(ccode).upper() + '%') 
            sql = "select act_ingr, id, flag from dv where %s order by act_ingr" % (sp_serch)# and flag=1 
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1], "flag": row[2] }
                result.append(r)
            Logs.add( task, 'true', self.user)
            return json.dumps({"req":"%s" % self.sp_task, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def addSprDv(self, sp_serch):    
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            sql = "UPDATE dv SET act_ingr = '%s', FLAG = 1 where id = %s" % ( sp_serch['_new'], sp_serch['_old'])
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def setSprDv(self, sp_serch):
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            sql = "DELETE FROM DV WHERE ID = '%s'" % ( sp_serch['id_link'] )
            dbc.execute(sql)
            db.commit()
            
            sql = "UPDATE DV SET FLAG = 1 WHERE ID = '%s'" % ( sp_serch['id_spr'] )
            dbc.execute(sql)
            
            sql = "UPDATE SPR SET ID_DV = '%s' WHERE (ID_DV = '%s')" % ( sp_serch['id_spr'], sp_serch['id_link'] )
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def setSprDv1(self):   
        sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            
            sql = "select distinct(c_mnn) from spr"
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "c_name" : row[0], "id_spr": row[1] }
                result.append(r)
                sql = "UPDATE SPR SET ID_DV = '%s' WHERE (ID_DV = '%s')" % ( sp_serch['id_spr'], sp_serch['old_name'] )
                dbc.execute(sql)
            
            db.commit()
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def delLink(self, sp_serch):
        sp_serch = json.loads(sp_serch)      
        
        db = utils.conMySpr()
        dbc = db.cursor()        
        try:            
            
            for row in sp_serch['mass']:
                if row == sp_serch['idspr']:
                    sql = "UPDATE SPR SET ID_TOVAR = 0 WHERE ID_TOVAR = %s" % row
                    dbc.execute(sql)
                    break
                else:
                    sql = "UPDATE SPR SET ID_TOVAR = 0 WHERE ID_SPR = %s" % row
                    dbc.execute(sql)
            
            db.commit()
            
            sql = "select count(c_tovar) from spr WHERE ID_TOVAR = %s" % sp_serch['idspr']
            dbc.execute(sql)
            result = []
            name = dbc.fetchone()[0]
            
            return json.dumps({ "success":"true", "results": [ name, name ] }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def addLink(self, sp_serch):
        sp_serch = json.loads(sp_serch)       
        
        db = utils.conMySpr()
        dbc = db.cursor()        
        try:
            if sp_serch['idspr'] == 0 or sp_serch['idspr'] == '0':
                sp_serch['idspr'] = min(sp_serch['mass'])
            
            for row in sp_serch['mass']:            
                sql = "UPDATE SPR SET ID_TOVAR = %s WHERE ID_SPR = %s" % (sp_serch['idspr'], row)
                dbc.execute(sql)
            
            db.commit()
            
            sql = "select c_tovar from spr WHERE ID_SPR = %s" % sp_serch['idspr']
            dbc.execute(sql)
            result = []
            name = dbc.fetchone()[0]
            
            return json.dumps({ "success":"true", "results": [ sp_serch['idspr'], name ] }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def editBarcode(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']       
        
        db = utils.conMySpr()
        dbc = db.cursor()
        
        try:
            sql = "UPDATE SPR SET BARCODE = '%s' WHERE ID_SPR = %s" % (sp_serch[0], sp_serch[1])
            dbc.execute(sql)            
            db.commit()            
            return json.dumps({ "success":"true", "results": "true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    
    
    def getSprTovar(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            tmp1 = sp_serch.split('+')
            tmp = tmp1[0].split(' ')
            if self.type_action != '2':
                sp_serch = ''
            s = 0
            for g in tmp:                
                s = s+1
                if self.type_action != '2': 
                    sp_serch += ' and '
                    sp_serch = sp_serch + "upper(c_tovar) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')                
            
            sp_serch1 = ''     
            if len(tmp1) > 1:
                tmp = tmp1[1].split(' ')
                s = 0
                for g in tmp:
                    sp_serch1 += ' and '
                    s = s+1
                    sp_serch1 = sp_serch1 + "upper(c_zavod) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')
            
            sort = ' order by c_tovar'
            ownerinfo = {}
            
            if self.type_action == '0':
                sql = "select * from spr where (id_tovar is null or id_tovar = 0) and COUNT_ACTUAL > 0 and COUNT_ACTUAL is not null %s %s %s " % ( sp_serch, sp_serch1, sort )
            if self.type_action == '1':
                sql = "select * from spr where id_tovar = id_spr  %s %s %s " % ( sp_serch, sp_serch1.replace('c_zavod', 'c_tovar'), sort )
            if self.type_action == '2':
                sql = "select * from spr where id_tovar = %s %s" % ( sp_serch, sort )
             
            dbc.execute(sql)
            result = []
            ownerinfo = {}
            f = dbc.fetchall()
            total = len(f)
            for row in f[int(self.start):int(self.start)+int(self.limit)]:            
                r = {
                        "sh_prc"  : row[0],                        
                        "id_spr"  : row[0],
                        "c_tovar" : row[1],
                        "c_zavod" : '',
                        "c_strana" : '',
                        "c_opis": row[14],
                        "group": '',
                        "usloviya" : '',
                        "sezon" : '',
                        "jv" : '',
                        "bind" : '',
                        "id_zavod" : row[12],
                        "id_strana" : row[13],
                        "id_sezon" : '',
                        "id_usloviya" : '',
                        "id_group": '',
                        "id_nds": '',
                        "c_dv" : '',
                        "id_dv": row[11],
                        "id_000" : '',
                        "id_111": '',
                        "id_222": '',
                        "id_333": '',
                        "id_444": '',
                        "actual": row[21],
                        "dopgr": [],
                        "barcode": row[18]
                }
                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 7 and groups.cd_code = %s )""" % row[0]

                dbc.execute(sql)
                tmp = dbc.fetchall()
                for dop in tmp:
                    tobj = {}
                    tobj["nm_group"] = dop[0]
                    tobj["cd_group"] = dop[1]
                    tobj["idx_group"] = dop[2]
                    #r["dopgr"]["items"].append(tobj)
                    r["dopgr"].append(tobj)
                
                
                sql = """select act_ingr from dv where id = %s""" % row[11]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_dv"] = tmp[0]
                
                sql = """select c_zavod from spr_zavod where id_spr = %s""" % row[12]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_zavod"] = tmp[0]
                    
                sql = """select c_strana from spr_strana where id_spr = %s""" % row[13]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_strana"] = tmp[0]                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 4 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["bind"] = tmp[0]
                    
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 5 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["jv"] = tmp[0]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 6 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["sezon"] = tmp[0]
                    r["id_sezon"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 3 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["usloviya"] = tmp[0]
                    r["id_usloviya"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 1 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["group"] = tmp[0]
                    r["id_group"] = tmp[1]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 2 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["id_nds"] = tmp[1]
                    
                if self.type_action == '2' and row[0] == int(sp_serch):
                    ownerinfo = r
                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group > 10 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchall()
                
                for rec in tmp:
                    if rec[2] < 100:
                        r["id_000"] = rec[1]
                    else:
                        r["id_%s" % rec[2]] = rec[1]
               
                
                result.append(r)
            return json.dumps({"req":"%s" % sql, "results":result, "total": total, "ownerinfo": ownerinfo}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"sql":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def getGroupList(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        try:
            sql = """select * from classifier where idx_group = 1"""
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:            
                r = { "cd_group": row[0], "nm_group": row[1] } 
                result.append(r)
            return json.dumps({"req":"%s" % sql, "results":result}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"sql":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    
    def getSprTovar1(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            tmp1 = sp_serch.split('+')
            tmp = tmp1[0].split(' ')
            if self.type_action != '2':
                sp_serch = ''
            s = 0
            for g in tmp:                
                s = s+1
                sp_serch += ' and '
                sp_serch = sp_serch + "upper(c_tovar) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')                
            
            sp_serch1 = ''     
            if len(tmp1) > 1:
                tmp = tmp1[1].split(' ')
                s = 0
                for g in tmp:
                    sp_serch1 += ' and '
                    s = s+1
                    sp_serch1 = sp_serch1 + "upper(c_zavod) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')
            
            sort = ' order by c_tovar'
            ownerinfo = {}
            if self.type_action != '':
                self.type_action = """inner join GROUPS t2 on (t1.id_spr = t2.cd_code and t2.cd_group = '%s')""" % self.type_action
            #self.type_action
            #sql = "select * from spr where (id_tovar is null or id_tovar = 0) and COUNT_ACTUAL > 0 and COUNT_ACTUAL is not null %s %s %s " % ( sp_serch, sp_serch1, sort )
            sql = """select * from spr t1 %s where 1 = 1 %s %s %s """  % ( self.type_action, sp_serch, sp_serch1, sort )
            #return sql
            dbc.execute(sql)
            result = []
            ownerinfo = {}
            f = dbc.fetchall()
            total = len(f)
            for row in f[int(self.start):int(self.start)+int(self.limit)]:            
                r = {
                        "sh_prc"  : row[0],                        
                        "id_spr"  : row[0],
                        "c_tovar" : row[1],
                        "c_zavod" : '',
                        "c_strana" : '',
                        "c_opis": row[14],
                        "group": '',
                        "usloviya" : '',
                        "sezon" : '',
                        "jv" : '',
                        "bind" : '',
                        "id_zavod" : row[12],
                        "id_strana" : row[13],
                        "id_sezon" : '',
                        "id_usloviya" : '',
                        "id_group": '',
                        "id_nds": '',
                        "c_dv" : '',
                        "id_dv": row[11],
                        "id_000" : '',
                        "id_111": '',
                        "id_222": '',
                        "id_333": '',
                        "id_444": '',
                        "actual": row[21],
                        "dopgr": [],
                        "barcode": row[18]
                }
                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 7 and groups.cd_code = %s )""" % row[0]

                dbc.execute(sql)
                tmp = dbc.fetchall()
                for dop in tmp:
                    tobj = {}
                    tobj["nm_group"] = dop[0]
                    tobj["cd_group"] = dop[1]
                    tobj["idx_group"] = dop[2]
                    #r["dopgr"]["items"].append(tobj)
                    r["dopgr"].append(tobj)
                
                
                sql = """select act_ingr from dv where id = %s""" % row[11]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_dv"] = tmp[0]
                
                sql = """select c_zavod from spr_zavod where id_spr = %s""" % row[12]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_zavod"] = tmp[0]
                    
                sql = """select c_strana from spr_strana where id_spr = %s""" % row[13]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["c_strana"] = tmp[0]                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 4 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["bind"] = tmp[0]
                    
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 5 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["jv"] = tmp[0]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 6 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["sezon"] = tmp[0]
                    r["id_sezon"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 3 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["usloviya"] = tmp[0]
                    r["id_usloviya"] = tmp[1]

                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 1 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["group"] = tmp[0]
                    r["id_group"] = tmp[1]
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group = 2 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchone()
                if tmp != None:
                    r["id_nds"] = tmp[1]
                    
                if self.type_action == '2' and row[0] == int(sp_serch):
                    ownerinfo = r
                
                
                sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups inner join classifier on (groups.cd_group = classifier.cd_group) inner join spr on (groups.cd_code = spr.id_spr)
                        where ( classifier.idx_group > 10 and groups.cd_code = %s )""" % row[0]
                dbc.execute(sql)
                tmp = dbc.fetchall()
                
                for rec in tmp:
                    if rec[2] < 100:
                        r["id_000"] = rec[1]
                    else:
                        r["id_%s" % rec[2]] = rec[1]
               
                
                result.append(r)
            return json.dumps({"req":"%s" % sql, "results":result, "total": total, "ownerinfo": ownerinfo}, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({ "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    
    def addClassifier(self, sp_serch):
        import uuid
        task = self.sp_task + " " + str(sp_serch)
        sp_serch = json.loads(sp_serch)
        Logs = Loging()
        genid = uuid.uuid1()
        try:
            db = utils.conMySpr()
            dbc = db.cursor()
            sql = "INSERT INTO CLASSIFIER (CD_GROUP, NM_GROUP, IDX_GROUP, FIRST_GROUP) VALUES ('%s', '%s', %s, NULL)" % (str(genid).replace('-', ''), sp_serch['spr'][0], sp_serch['spr'][1])
            dbc.execute(sql)
            db.commit()
            Logs.add( task, 'true', self.user)
            return json.dumps({ "results":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            Logs.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    
    def Tools1(self):    
        #{"id_spr":1151,"old_name":232}
        #sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            
            sql = "select upper(c_mnn), upper(c_zavod), upper(c_strana), id_spr from spr"
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
        #         row[0].strip(), row[1].strip().replace("'", "_"), row[2].strip(), row[3]
                sql = "UPDATE SPR SET C_MNN= '%s', C_ZAVOD = '%s', C_STRANA = '%s' WHERE (ID_SPR = %s)"  %\
                ( row[0].strip().replace("'", "_"), row[1].strip().replace("'", "_"), row[2].strip().replace("'", "_"), row[3] )
                dbc.execute(sql)
            
            db.commit()
            return json.dumps({ "results":"tools1" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    def Tools2(self):    
        #{"id_spr":1151,"old_name":232}
        #sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            
            sql = "select upper(act_ingr), id from dv"
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            for row in f:
                sql = '''UPDATE DV SET act_ingr = '%s' WHERE (id = %s)'''  % ( row[0].strip(), row[1] )
                dbc.execute(sql)
            
            db.commit()
            return json.dumps({ "results":"tools2" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
        
    def Tools3(self):    
        #{"id_spr":1151,"old_name":232}
        #sp_serch = json.loads(sp_serch)
        db = utils.conMySpr()
        dbc = db.cursor()
        if str(sp_serch) == "999999":
            sp_serch = ""
        try: 
            sql = "select c_mnn, c_zavod, c_strana, id_spr, id_zavod, id_strana, id_dv from spr"
            dbc.execute(sql)
            result = []
            f = dbc.fetchall()
            it = 0
            for row in f:
                it=it+1
        #         it
                sql = "select id_spr from spr_zavod where c_zavod = '%s'" % row[1].strip().replace("'", "_")
                dbc.execute(sql)
                f1 = dbc.fetchone()
               #  f1
                if f1 == None: 
        #             row[1]                  
                    sql = "INSERT INTO spr_zavod (c_zavod) VALUES ('%s') RETURNING id_spr" % row[1].strip().replace("'", "_")
                    dbc.execute(sql)
                    db.commit()
                    id_spr = dbc.fetchone()[0]
                    sql = "UPDATE SPR SET id_zavod = '%s' WHERE (ID_SPR = %s)" % ( id_spr, row[3])
                else:
                    sql = "UPDATE SPR SET id_zavod = '%s' WHERE (ID_SPR = %s)" % ( f1[0], row[3])
                dbc.execute(sql)
            db.commit()
            return json.dumps({ "results":"tools3" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')

    def findLnkTovar(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            
            old_sp_serch = sp_serch
            tmp3 = sp_serch.split('*')
            tmp1 = sp_serch.split('+')
            tmp = tmp1[0].split(' ')
            if self.type_action != '2':
                sp_serch = ''
            s = 0
            for g in tmp:                
                s = s+1
                sp_serch += ' and '
                sp_serch = sp_serch + "upper(c_tovar) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')                
            
            sp_serch1 = ''     
            if len(tmp1) > 1:
                tmp = tmp1[1].split(' ')
                s = 0
                for g in tmp:
                    sp_serch1 += ' and '
                    s = s+1
                    sp_serch1 = sp_serch1 + "upper(c_zavod) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')
                    
            sp_serch2=''
            #tmp3 = old_sp_serch.split('*')
            if len(tmp3) > 1:
                sp_serch2 = " and id_spr = %s" % tmp3[1]
            
            sort = ' order by dt desc'
            ownerinfo = {}
            
            
            #sql = """select id_spr, c_tovar, dt, sh_prc from lnk t1 where 1 = 1 %s %s %s %s"""  % ( sp_serch, sp_serch1, sp_serch2, sort )
            if len(tmp3) > 1:
                sql = """select count(*) from lnk where 1 = 1 %s """  % ( sp_serch2)                
            else:
                sql = """select count(*) from lnk where 1 = 1 %s %s %s"""  % ( sp_serch, sp_serch1, sp_serch2)
            dbc.execute(sql)
            tmp44 = dbc.fetchall()
            total = tmp44[0][0]
            
            if len(tmp3) > 1:
                sql = """select first %s skip %s id_spr, c_tovar, dt, sh_prc from lnk t1 where 1 = 1 %s %s"""  % ( self.limit, self.start, sp_serch2, sort )
            else:
                sql = """select first %s skip %s id_spr, c_tovar, dt, sh_prc from lnk t1 where 1 = 1 %s %s %s %s"""  % ( self.limit, self.start, sp_serch, sp_serch1, sp_serch2, sort )
                
            #return sql
            dbc.execute(sql)
            result = []
            ownerinfo = {}
            f = dbc.fetchall()
            #total = len(f)
            for row in f:            
                r = {
                    'id_spr': row[0], 
                    'c_tovar':row[1], 
                    'dt': row[2].strftime("%d.%m.%Y"),
                    'sh_prc': row[3]
                }
                result.append(r)
            return json.dumps({ "results":result, "total": total}, ensure_ascii=False).encode('utf8')
        except Exception,e:
            return json.dumps({ "results":sql, "error": e }, ensure_ascii=False).encode('utf8')
        
    
    def findSprTovar(self, sp_serch):
        db = utils.conMySpr()
        dbc = db.cursor()
        
        if str(sp_serch) == "999999":
            sp_serch = ""
        try:
            old_sp_serch = sp_serch
            tmp1 = sp_serch.split('+')
            tmp = tmp1[0].split(' ')
            if self.type_action != '2':
                sp_serch = ''
            s = 0
            for g in tmp:                
                s = s+1
                sp_serch += ' and '
                sp_serch = sp_serch + "upper(c_tovar) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')                
            
            sp_serch1 = ''     
            if len(tmp1) > 1:
                tmp = tmp1[1].split(' ')
                s = 0
                for g in tmp:
                    sp_serch1 += ' and '
                    s = s+1
                    sp_serch1 = sp_serch1 + "upper(c_zavod) like upper('%s')"\
                    % ('%' + g.decode('utf8').upper() + '%')
                    
            sp_serch2=''
            tmp3 = old_sp_serch.split('*')
            if len(tmp3) > 1:
                sp_serch2 = " or id_spr = %s" % tmp3[1]
            
            sort = ' order by c_tovar'
            ownerinfo = {}
            
            sql = """select id_spr, c_tovar from spr t1 where 1 = 1 %s %s %s"""  % ( sp_serch, sp_serch2, sort )
            #return sql
            dbc.execute(sql)
            result = []
            ownerinfo = {}
            f = dbc.fetchall()
            total = len(f)
            for row in f[int(self.start):int(self.start)+int(self.limit)]:            
                r = {
                    'id_spr': row[0], 
                    'c_tovar':row[1]
                }
                result.append(r)
            return json.dumps({ "results":result, "total": total}, ensure_ascii=False).encode('utf8')
        except Exception,e:
            return json.dumps({ "results":sql, "error": e }, ensure_ascii=False).encode('utf8')

    def delLnkSpr(self, sp_serch):
        task = self.sp_task + " " + str(sp_serch)        
        db = utils.conMySpr()
        dbc = db.cursor()
        try: 
            sql = "delete from lnk WHERE sh_prc = '%s'" % sp_serch
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "success":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')
    
    def reLnkSpr(self, sp_serch):
        sp_serch = json.loads(sp_serch)['mass']
        db = utils.conMySpr()
        dbc = db.cursor()
        try: 
            sql = "update lnk set id_spr = %s WHERE sh_prc = '%s'" % (sp_serch[0], sp_serch[1])
            dbc.execute(sql)
            db.commit()
            return json.dumps({ "success":"true" }, ensure_ascii=False).encode('utf8')
        except  Exception, e:
            return json.dumps({"req":"%s" % self.sp_task, "success":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode('utf8')


if __name__ == "__main__":
    invLinkTools = invLinkTools()
    import pprint
    print invLinkTools.sprAddNew('{"spr":["1111111111111","","",14365,"","",false,null,null,"ZakMedCtg.17",null,0,null,null,null,null,null,[],"444444444444444444444"]}')
    #sp_task:sprAddNew
    #sp_serch:{"spr":["1234","","",14365,"","",false,null,null,"ZakMedCtg.17",null,0,null,null,null,null,null,[],null]}
