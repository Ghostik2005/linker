#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, xlsx2tsv
reload(sys)
sys.setdefaultencoding('utf8')

import os
#from connect import * 
import json
#from ostatki import *
#import options
import utils

class DBsync:
    def Load(self):
        #self.clearAll1()
        db = utils.conMySpr()
        dbc = db.cursor()
        
        tmpArray = []
        error = ''
        tmpArray, error = xlsx2tsv.load('SPRAVKA_1.xlsx')
        code = '1251'
        i = 0
        try:
            print len(tmpArray)
            for rec in tmpArray:
                
               
                if i != 0:
                    splitResult = rec.replace("'", '''''').split('\t')
                    #print splitResult[0].encode(code)
                    #print splitResult[7].encode(code)
                    #print splitResult[9].encode(code)
                    tovar = {}
#                    print splitResult[8]
                    
                    if splitResult[8] == '': splitResult[8] = '0'
                    
                    sql = """INSERT INTO SPRIMP_MAIN (NAIM, SPRNAIMID, SPRFORMID, DRUG_ID , COUNTRYID, FIRMID, DOZA, EDM, BARCODE, KOD3, SPRID) 
                    VALUES ('%s', %s, %s, %s, %s, %s, %s, '%s', '%s', '%s', %s)
                    """ % (splitResult[0].encode(code),splitResult[1],splitResult[2],splitResult[3],splitResult[4],splitResult[5],\
                    splitResult[6],splitResult[7].encode(code),splitResult[8].encode(code),splitResult[9].encode(code),splitResult[10])
                    
                    print sql
                    try:
                        dbc.execute(sql)
                    except  Exception, e:
                        return False, e
                else: 
                    print '---'
                    i = i + 1
            db.commit()
            
    
                
            """
                    #print splitResult[3]
                    tovar['title'] = splitResult[3]
                    tovar['titleru'] = splitResult[4]   
                    tovar['sellbox'] = splitResult[15]                    
                    tovar['baseprice'] = splitResult[16].replace(',', '.')
                    tovar['nacprice'] = splitResult[17].replace(',', '.')
                    tovar['price'] = splitResult[18].replace(',', '.')
                    tovar['skidka'] = splitResult[19].replace('%', '')
                    tovar['lowprice'] = splitResult[20].replace(',', '.')
                    tovar['tovartype'] = splitResult[21]
                    tovar['store'] = splitResult[22]#minprice
                    tovar['visible'] = splitResult[23]
                    tovar['article'] = splitResult[29]#28
                    tovar['inbox'] = splitResult[13]
                    
                    if tovar['article'] == None or len(tovar['article']) < 3:
                        continue
                    
                    if splitResult[30] != None and splitResult[30] != '' and tovar['visible'] != '0':
                        tovar['hash'] = self.genHash(splitResult[30])
                        self.setLink([splitResult[30], tovar['hash']])
                    else:
                        tovar['hash'] = ''
                    
                    idx = 0
                    linkArray = []
                    if tovar['tovartype'] != '':
                        tovar["count"] = 0
                    #    print tovar['visible']
                    #if tovar['visible'] != '0':
                    for taRec in toolsArray:
                        tmpres = splitResult[taRec[1]]
                        tmpId = self.getSprID(tmpres, idx, tovar['visible'])
                        if tmpId == None: tmpId = self.addSprValue(tmpres, idx, tovar['visible'])
                        tovar[taRec[0]] = tmpId
                        linkArray.append(tmpId)
                        idx += 1
                    
                    if tovarColection.find({'article':tovar['article']}).count() > 0:
                       # print 'update'
                        if tovar['article'] == '002376': print tovar
                        tovarColection.update( { 'article':tovar['article'] }, { "$set": tovar } )
                    else:
                        tovarColection.insert(tovar)
                i += 1
            self.sprLink();
            remains = Remains()
            remains.load()
            """
            return True, None
        except  Exception, e:
            return False, e
    
    def getSprID(self, value, sprType, value1):
        key = "title"
        key1 = "visible"
        if sprType == 0: cursor = sprTypeColection.find({ key: value, key1: value1 })            
        if sprType == 1: cursor = sprCategoryColection.find({ key: value, key1: value1 })
        if sprType == 2: cursor = sprBrendColection.find({ key: value, key1: value1 })
        if sprType == 3: cursor = sprFabricatorColection.find({ key: value, key1: value1 })
        if sprType == 4: cursor = sprImporterColection.find({ key: value, key1: value1 })
        if sprType == 5: cursor = sprCountryColection.find({ key: value, key1: value1 })
        if sprType == 6: cursor = sprRegionColection.find({ key: value, key1: value1 })
        if sprType == 7: cursor = sprDelayColection.find({ key: value, key1: value1 })
        if sprType == 8: cursor = sprAlcazarColection.find({ key: value, key1: value1 })
        if sprType == 9: cursor = sprVolumeColection.find({ key: value, key1: value1 })
        if sprType == 10: cursor = sprPoketColection.find({ key: value, key1: value1 })
        if sprType == 11: cursor = sprCustomColection.find({ key: value, key1: value1 })
        if sprType == 12: cursor = sprCustomColection1.find({ key: value, key1: value1 })
        if sprType == 13: cursor = sprCustomColection2.find({ key: value, key1: value1 })
        if sprType == 14: cursor = sprCustomColection3.find({ key: value, key1: value1 })
        if sprType == 15: cursor = sprCustomColection4.find({ key: value, key1: value1 })
        if sprType == 16: cursor = sprCustomColection5.find({ key: value, key1: value1 })
        if sprType == 17: cursor = sprCustomColection6.find({ key: value, key1: value1 })
        
        
        for rec in cursor:
                return rec['_id']
        
        return None
    
    def checkSprValue(self, value, key, sprType):
        if sprType == 0:  return sprTypeColection.find({ key: value }).count()
        if sprType == 1:  return sprCategoryColection.find({ key: value }).count()
        if sprType == 2:  return sprBrendColection.find({ key: value }).count()
        if sprType == 3:  return sprFabricatorColection.find({ key: value }).count()
        if sprType == 4:  return sprImporterColection.find({ key: value }).count()
        if sprType == 5:  return sprCountryColection.find({ key: value }).count()
        if sprType == 6:  return sprRegionColection.find({ key: value }).count()
        if sprType == 7:  return sprDelayColection.find({ key: value }).count()
        if sprType == 8:  return sprAlcazarColection.find({ key: value }).count()
        if sprType == 9:  return sprVolumeColection.find({ key: value }).count()
        if sprType == 10: return sprPoketColection.find({ key: value }).count()
        if sprType == 11: return sprCustomColection.find({ key: value }).count()
        if sprType == 12: return sprCustomColection1.find({ key: value }).count() 
        if sprType == 13: return sprCustomColection2.find({ key: value }).count()
        if sprType == 14: return sprCustomColection3.find({ key: value }).count()
        if sprType == 15: return sprCustomColection4.find({ key: value }).count()
        if sprType == 16: return sprCustomColection5.find({ key: value }).count()
        if sprType == 17: return sprCustomColection6.find({ key: value }).count()
        return 0
    
    def addSprValue(self, value, sprType, value1):
       # print 'add:', value, "in:", sprType
        key = "title"
        key1 = "visible"
        if sprType == 0:  return sprTypeColection.insert({ key: value, key1: value1})
        if sprType == 1:  return sprCategoryColection.insert({ key: value, key1: value1})
        if sprType == 2:  return sprBrendColection.insert({ key: value, key1: value1})
        if sprType == 3:  return sprFabricatorColection.insert({ key: value, key1: value1})
        if sprType == 4:  return sprImporterColection.insert({ key: value, key1: value1})
        if sprType == 5:  return sprCountryColection.insert({ key: value, key1: value1})
        if sprType == 6:  return sprRegionColection.insert({ key: value, key1: value1})
        if sprType == 7:  return sprDelayColection.insert({ key: value, key1: value1})
        if sprType == 8:  return sprAlcazarColection.insert({ key: value, key1: value1})
        if sprType == 9:  return sprVolumeColection.insert({ key: value, key1: value1})
        if sprType == 10: return sprPoketColection.insert({ key: value, key1: value1})
        if sprType == 11: return sprCustomColection.insert({ key: value, key1: value1})
        if sprType == 12: return sprCustomColection1.insert({ key: value, key1: value1})
        if sprType == 13: return sprCustomColection2.insert({ key: value, key1: value1})
        if sprType == 14: return sprCustomColection3.insert({ key: value, key1: value1})
        if sprType == 15: return sprCustomColection4.insert({ key: value, key1: value1})
        if sprType == 16: return sprCustomColection5.insert({ key: value, key1: value1})
        if sprType == 17: return sprCustomColection6.insert({ key: value, key1: value1})
        return 0
        
    def clearAll(self): 
        tovarColection.remove({})
        sprTypeColection.remove({})
        sprCategoryColection.remove({})
        sprBrendColection.remove({})
        sprFabricatorColection.remove({})
        sprImporterColection.remove({})
        sprCountryColection.remove({})
        sprRegionColection.remove({})
        sprDelayColection.remove({})
        sprAlcazarColection.remove({})
        sprVolumeColection.remove({})
        sprPoketColection.remove({})
        sprCustomColection.remove({})
        sprCustomColection1.remove({})
        sprCustomColection2.remove({})
        sprCustomColection3.remove({})
        sprCustomColection4.remove({})
        sprCustomColection5.remove({})
        sprCustomColection6.remove({})
        return None
    
    
    def setLink(self, params):
        for rec in linkColection.find({'hash':params[1]}):
            return True, None
        linkColection.insert({"name": params[0], "hash": params[1]})
        return True, None
    
    def genHash(self, value): 
        s = value.upper().replace('.',',').split()
        n = []
        s1 = []
        for x in u''.join(s):
            c = ord(x)
            if c > 57:
                s1.append(x)
            elif c > 47:
                n.append(x)
        s1.sort()
        n.extend(s1)
        s = u''.join(n)
        sh_prc = hashlib.md5()        
        sh_prc.update(s.encode('1251'))
        return sh_prc.hexdigest()
    
    
    def upg1(self, idtarget, idowner, collecttarget):
        for rec in collecttarget.find({"_id": idtarget}):
            tmparr = rec.get("owner",[])
            if str(idowner) not in tmparr: 
                tmparr.append(str(idowner))
            collecttarget.update({"_id": idtarget  },{"$set":{"owner":tmparr} })
    
    def sprLink(self):  
        count = tovarColection.find().count()
        count1 = 0
        for trec in tovarColection.find():          
            if trec["visible"] == '0': continue
            self.upg1(trec["catrgory"]  , trec["type"], sprCategoryColection   ) 
            self.upg1(trec["brend"]     , trec["type"], sprBrendColection      )
            self.upg1(trec["fabricator"], trec["type"], sprFabricatorColection )
            self.upg1(trec["importer"]  , trec["type"], sprImporterColection   )
            self.upg1(trec["country"]   , trec["type"], sprCountryColection    )
            self.upg1(trec["region"]    , trec["type"], sprRegionColection     )
            self.upg1(trec["delay"]     , trec["type"], sprDelayColection      )
            self.upg1(trec["alcazar"]   , trec["type"], sprAlcazarColection    )
            self.upg1(trec["volume"]    , trec["type"], sprVolumeColection     )
            self.upg1(trec["poket"]     , trec["type"], sprPoketColection      )
            self.upg1(trec["custom"]    , trec["type"], sprCustomColection     )
            self.upg1(trec["custom1"]   , trec["type"], sprCustomColection1    )
            self.upg1(trec["custom2"]   , trec["type"], sprCustomColection2    )
            self.upg1(trec["custom3"]   , trec["type"], sprCustomColection3    )
            self.upg1(trec["custom4"]   , trec["type"], sprCustomColection4    )
            self.upg1(trec["custom5"]   , trec["type"], sprCustomColection5    )
            self.upg1(trec["custom6"]   , trec["type"], sprCustomColection6    )
            
            count1 = count1 + 1
            #print "обработанно: %s из %s" % (count1,count)
            
        return None
        
    def clearAll1(self): 
        #tovarColection.remove({})
        sprTypeColection.remove({})
        sprCategoryColection.remove({})
        sprBrendColection.remove({})
        sprFabricatorColection.remove({})
        sprImporterColection.remove({})
        sprCountryColection.remove({})
        sprRegionColection.remove({})
        sprDelayColection.remove({})
        sprAlcazarColection.remove({})
        sprVolumeColection.remove({})
        sprPoketColection.remove({})
        sprCustomColection.remove({})
        sprCustomColection1.remove({})
        sprCustomColection2.remove({})
        sprCustomColection3.remove({})
        sprCustomColection4.remove({})
        sprCustomColection5.remove({})
        sprCustomColection6.remove({})
        return None
    
if __name__ == "__main__":
    DBsync = DBsync()
    DBsync.Load()
    #print DBsync.clearAll1()
    #linkColection.remove()
    #remainsColection.remove()
    #remainsColection.remove()
    """
    print DBsync.Load()   
    for rec in sprCategoryColection.find():
        #print rec
        if str(rec['_id']) == '547848038776a10a88dcbed4':
            print rec['title'].encode('1251')
    """