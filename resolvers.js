// import Neo4j driver
// import {v1 as neo4j} from 'neo4j-driver';
var neo4j = require('neo4j-driver').v1;
const { base64encode, base64decode } = require('nodejs-base64');
var EmailUsed=0;
var LastMonth_Volume =0;
var Daily_Volume =0;
var In_Compliance =0;
var out_of_Compliance=0;
var ThisMonth_Volume =0;
var Total_NoResponse =0;
var Totalcount =0;
var PrevRole=0;
var Charttype="";

// create Neo4j driver instance, here we use a Neo4j Sandbox instance. See neo4j.com/sandbox-v2, Recommendations example dataset
// let driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "root"));
// let driver = neo4j.driver("bolt://34.212.248.28", neo4j.auth.basic("neo4j", "hipaas2"));
// let driver = neo4j.driver("bolt://10.0.1.71:30106", neo4j.auth.basic("neo4j", "none"));
let driver = neo4j.driver("bolt://10.0.1.238:7687", neo4j.auth.basic("neo4j", "root")); //graph db
// let driver = neo4j.driver("bolt://10.229.4.248:7687", neo4j.auth.basic("neo4j", "Hipaas123")) //molina db
// http://10.0.1.238:7474/
  // http://10.0.1.71:30105/browser/
var d = new Date();
var pDate = new Date();
pDate.setDate(d.getDate() - 1);

var pDay=pDate.getDate();
var pDaymonth=pDate.getMonth() +1;
var pDayYear=pDate.getFullYear();

var cMonth = d.getMonth() +1;
var cYear = d.getFullYear();

var pMonth =(d.getMonth() + 1 == 1) ? 12 : cMonth -1 ;
var pYear = (d.getMonth() + 1 == 1) ? cYear-1 : cYear;

// console.log(d);
// console.log(cMonth);
// console.log(cYear);
// console.log(pMonth);
// console.log(pYear);
// console.log(pDate);
// console.log(pDay);
// console.log(pDaymonth);
// console.log(pDayYear);

const resolveFunctions = {
  Query: {
    PagedData1(_, params) {
      let session = driver.session();
      //let query = "MATCH (n:FileHeader_Enrollment),(m:FileHeader_Enrollment) where m.FileName=$fileName RETURN count(n) as ncount,count(m) as mcount;";
      let query = "MATCH (n:FileHeader_Enrollment),(m:FileHeader_Enrollment) where m.FileName=$fileName WITH count(n) AS ncount, count(m) AS mcount RETURN  {ncount: toString(ncount), mcount: toString(mcount)} AS PagedData1;";
      return session.run(query, params)
        .then(result => {           
          return result.records.map(record => {return record.get('PagedData1')})
        })
    },    
    PagedData2(_, params) {
      let session = driver.session();
      let query = "MATCH (n:FileHeader_Enrollment),(m:MemberInfo_Enrollment)where n.FileName=$fileName RETURN distinct  n {.FileName , .FileDate, .ISA06 } as PagedData2;";
      return session.run(query, params)
        .then( result => {           
          return result.records.map(record => {return record.get('PagedData2')})
        })
    },
    PagedData3: () => {
      let session = driver.session();
      // let query = "MATCH (n:FileHeader_Enrollment),(m:MemberInfo_Enrollment) RETURN n.FileName as FileName,n.FileDate as FileDate,n.ISA06 as ISA06,count(m)as mcount;";
      let query = "MATCH (n:FileHeader_Enrollment),(m:FileHeader_Enrollment) WITH n.FileName as FileName,n.FileDate as FileDate,n.ISA06 as ISA06, count(m) AS mcount RETURN  {FileName: FileName ,FileDate: FileDate ,ISA06: ISA06, mcount : toString(mcount)} AS PagedData3;";
      return session.run(query)
        .then(result => {
          return result.records.map(record => {return record.get('PagedData3')})
        })
    },
    PagedData4(_, params) {
      let session = driver.session();
      let query = "MATCH (n:MemberInfo_Enrollment),(m:MemberInfo_Enrollment),(o:MemberInfo_Enrollment) where n.INS03_MaintenanceTypeCode=$MaintainCode1 and m.INS03_MaintenanceTypeCode=$MaintainCode2 and o.INS03_MINS03_MaintenanceTypeCode=$MaintainCode3 WITH count(n) as ncount,count(m) as mcount,count(o) as ocount return {ncount: toString(ncount) ,mcount: toString(mcount),ocount: toString(ocount)} as PagedData4 ;";
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('PagedData4')})
        })
    },
    Eligibilty270Request(_, params) {
      let session = driver.session();
      let query = "MATCH (n:EligibilityRequest {EventName:'Request'})  where n.HiPaaSUniqueID=$HiPaaSUniqueID  RETURN { Message:n.Data  } as Eligibilty270Request;";
      return session.run(query, params)
        .then(result => {
          // return result.records.map(record => {return record.get('Eligibilty270Request').properties})
          return result.records.map(record => {return record.get('Eligibilty270Request')})
        })
    },
    Eligibilty271Response(_, params) {
      let session = driver.session();
      let query = "MATCH (n:EligibilityRequest) where n.HiPaaSUniqueID=$HiPaaSUniqueID and n.EventName ='Response' RETURN { Message:n.Data } as Eligibility271_Response;";
      return session.run(query, params)
        .then(result => {
          // return result.records.map(record => {return record.get('Eligibility271_Response').properties})
          return result.records.map(record => {return record.get('Eligibility271_Response')})
        })
    },
    
EligibilityAllDtlTypewise(_, params) {
  let session = driver.session();     
  if (Object.values(params)[8] =="")
  {
    Object.values(params)[8]="Order By Date"
  }
  let query = `Match (p:EligibilityRequest {EventName :'Request'}) where
              ($Sender = '' or ($Sender <>'' and Replace(p.Sender,' ','')= Replace($Sender,' ','') ))                    
               and ($TransactionID = '' or ($TransactionID <>'' and p.TransactionID contains $TransactionID)) 
               and ($State = '' or ($State <>'' and p.State= $State ))  
               and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
               month: apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
               Day:apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
               
               Optional Match (q:EligibilityRequest {EventName :'Response'}) where p.HiPaaSUniqueID=q.HiPaaSUniqueID
               and ( $TypeID = '' or ($TypeID <>'' and q.TransactionStatus =$TypeID))                          
               and ($ErrorType = '' or ($ErrorType <>'' and q.ErrorMessage= $ErrorType ))                                     
               With count(p) as RecCount 

               MATCH (n:EligibilityRequest {EventName :'Request'}) Where
               ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ',''))) 
               and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
               and ($State = '' or ($State <>'' and n.State= $State ))                   
               and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
               month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
               Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 

               Optional Match (m:EligibilityRequest {EventName :'Response'}) where n.HiPaaSUniqueID=m.HiPaaSUniqueID  
               and ( $TypeID = '' or ($TypeID <>'' and m.TransactionStatus =$TypeID))                 
               and ($ErrorType = '' or ($ErrorType <>'' and m.ErrorMessage= $ErrorType ))                  
               
               WITH RecCount as RecCount, n.HiPaaSUniqueID as HiPaaSUniqueID,                    
               '' as ErrorDescription ,'' as Error_Type ,'' as Error_Code , 
               n.EventCreationDateTime as Date ,m.TransactionStatus as Trans_type ,n.Sender as Submiter ,n.TransactionID as Trans_ID
               RETURN  {RecCount: toString(RecCount), HiPaaSUniqueID: HiPaaSUniqueID, Date : Date , Trans_type :Trans_type  
               ,Submiter :Submiter , Trans_ID :Trans_ID ,Error_Type : Error_Type, Error_Code :Error_Code , ErrorDescription: ErrorDescription } AS Eligibilty_DateWise 
               ` +  Object.values(params)[8]  + ` SKIP ($page - 1) * 10 LIMIT 10 ;`;
  
    // console.log(query);
  return session.run(query, params)
    .then(result => {
      return result.records.map(record => {return record.get('Eligibilty_DateWise')})
    })
},
    Eligibilty270(_, params) {
      let session = driver.session();            
      
            let  query =`  Optional MATCH (n1:EligibilityRequest {EventName :'Request'}) where 
            ($Sender = '' or ($Sender <>'' and Replace(n1.Sender,' ','')= Replace($Sender,' ','') ))                              
            and ($TransactionID = '' or ($TransactionID <>'' and n1.TransactionID contains $TransactionID)) 
            and ($State = '' or ($State <>'' and n1.State= $State ))    
            and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).year=date({year:`+ pYear +`, month:`+ pMonth +`}).year 
    and date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).month=date({year:`+ pYear +`, month:`+ pMonth +`}).month                    
            With count(n1) AS LastMonth_Volume
    
  Optional MATCH (n2:EligibilityRequest {EventName :'Request'}) where 
         ($Sender = '' or ($Sender <>'' and Replace(n2.Sender,' ','')= Replace($Sender,' ','') ))                              
          and ($TransactionID = '' or ($TransactionID <>'' and n2.TransactionID contains $TransactionID)) 
          and ($State = '' or ($State <>'' and n2.State= $State ))    
          and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
          month: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
          Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).year=date({year:`+ cYear +`, month:`+ cMonth +`}).year 
          and date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
          month: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
          Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).month=date({year:`+ cYear +`, month:`+ cMonth +`}).month  
          With count(n2) AS ThisMonth_Volume, LastMonth_Volume as LastMonth_Volume
  
  Optional MATCH (n3:EligibilityRequest {EventName :'Request'}) where  
          ($Sender = '' or ($Sender <>'' and Replace(n3.Sender,' ','')= Replace($Sender,' ','') ))                              
          and ($TransactionID = '' or ($TransactionID <>'' and n3.TransactionID contains $TransactionID)) 
          and ($State = '' or ($State <>'' and n3.State= $State ))    
          and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
          month: apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
          Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days })=date()
          With count(n3) AS Daily_Volume, ThisMonth_Volume AS ThisMonth_Volume, LastMonth_Volume as LastMonth_Volume  
  
  Optional MATCH (n4:EligibilityRequest {EventName: 'Request'}) Where
          ($Sender = '' or ($Sender <>'' and Replace(n4.Sender,' ','')= Replace($Sender,' ','') )) 
          and ($TransactionID = '' or ($TransactionID <>'' and n4.TransactionID contains $TransactionID))
          and ($State = '' or ($State <>'' and n4.State= $State ))
          and ($StartDt = '' or ($StartDt <>'' 
          and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
          month: apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
          Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))

  OPTIONAL MATCH(x:EligibilityRequest) 
          WHERE x.EventName = 'Response' AND  n4.HiPaaSUniqueID =x.HiPaaSUniqueID          
          With Daily_Volume AS Daily_Volume, ThisMonth_Volume AS ThisMonth_Volume, LastMonth_Volume as LastMonth_Volume
  
  , n4.HiPaaSUniqueID as Request,x.HiPaaSUniqueID as Response, x.TransactionStatus as Status,x.ErrorMessage as ErrorMessage,
         apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date, 
         apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date1 
        
         With  Daily_Volume AS Daily_Volume, ThisMonth_Volume AS ThisMonth_Volume, LastMonth_Volume as LastMonth_Volume,
   Request as Request, Response as Response, Status as Status, ErrorMessage as ErrorMessage, datetime({year: Date.years, month: Date.months, Day:Date.days , hour:Date.hours, minute: Date.minutes, second: Date.seconds}) as Dt1,
         datetime({year: Date1.years, month: Date1.months, Day:Date1.days , hour:Date1.hours, minute: Date1.minutes, second: Date1.seconds}) as Dt2 , 10^2 AS factor 
        
         WITH count(Request)-count(Response) as Total_NoResponse, Daily_Volume AS Daily_Volume, ThisMonth_Volume AS ThisMonth_Volume, LastMonth_Volume as LastMonth_Volume,
         round(factor * toFloat(sum(case when toString(Date(Dt2))="0000-01-01" then 0 else duration.inSeconds(Dt1,Dt2).seconds end))/toFloat(count(Request)))/factor as AvgResTime, count(Request) AS ncount ,sum(CASE  WHEN Status = 'Pass' THEN 1 ELSE 0 END) as Success, sum(CASE WHEN Status = 'Fail' THEN 1 ELSE 0 END)  as Error 
         ,sum(CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 1 ELSE 0 END) as In_Compliance, sum(CASE WHEN duration.inSeconds(Dt1,Dt2).seconds > 20 THEN 1 ELSE 0 END) as out_of_Compliance, 
         sum(CASE WHEN Status ='Fail' and ErrorMessage in ['TA1','999'] THEN 1 ELSE 0 END) as Invalid_Trans , 
         case when count(Request) =0 then 0 else round(factor * toFloat(sum( CASE WHEN Status = 'Fail' THEN 1 ELSE 0 END) *100)/toFloat(count(Request)))/factor end as Error_Per,  
         case when count(Request) =0 then 0 else round(factor * toFloat(sum(CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 1 ELSE 0 END) *100) /toFloat(count(Request)))/factor end as In_Compliance_Per, 
         case when count(Request) =0 then 0 else round(factor *  toFloat(sum(CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds > 20 THEN 1 ELSE 0 END) *100) /toFloat(count(Request)))/factor end as out_of_Compliance_per,
         case when count(Request) =0 then 0 else round(factor *  toFloat( (count(Request)-count(Response))  * 100 )/toFloat(count(Request)))/factor end as NoResponse_Per, 
         case when  LastMonth_Volume  =0 then 0 else round(factor *  toFloat(( ThisMonth_Volume - LastMonth_Volume ) * 100 )/ toFloat( LastMonth_Volume ))/factor end as RealTime_Per
        
         RETURN {Daily_Volume :toString( Daily_Volume ) , ThisMonth_Volume: toString( ThisMonth_Volume ),	LastMonth_Volume :toString( LastMonth_Volume ), 
         In_Compliance : toString(In_Compliance) , out_of_Compliance : toString(out_of_Compliance) ,AvgResTime: toString(AvgResTime) ,TotalNumOfReq :toString(ncount), Success: toString(Success), 
         Error : toString(Error) , Error_Per : toString(Error_Per) ,NoResponse_Per : toString(NoResponse_Per) ,
         In_Compliance_Per : toString(In_Compliance_Per) ,out_of_Compliance_per : toString(out_of_Compliance_per), 
         RealTime_Per: toString(RealTime_Per), Invalid_Trans: tostring(Invalid_Trans)} AS Eligibilty270;`
         
      //  console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Eligibilty270')})
        })
    },
    Eligibilty271ErrorwiseCount(_, params) {
      let session = driver.session();      
      
      // let query1 =`MATCH (n:EligibilityRequest {EventName: 'Request'}), (m:EligibilityRequest {EventName :'Response'}) where n.HiPaaSUniqueID = m.HiPaaSUniqueID  
             
      //        and m.TransactionStatus= 'Fail' and m.ErrorMessage CONTAINS 'AAA' 
      //        and ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','') ))                                       
      //        and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
      //        and ($State = '' or ($State <>'' and n.State= $State )) 
      //        and ($ErrorType = '' or ($ErrorType <>'' and m.ErrorMessage= $ErrorType ))             
      //        and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //        month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      //        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
            
      //        return count(m) as Totalcount ; ` ;

      //       session.run(query1, params)
      //         .then(result => {
      //           result.records.map(record => {
      //             Totalcount = record.get('Totalcount').toInt();   
      //           })
      //         }) ;     

      // let query =`MATCH (n:EligibilityRequest {EventName: 'Request'}), (m:EligibilityRequest {EventName :'Response'}) where  n.HiPaaSUniqueID=m.HiPaaSUniqueID  
      //            and m.TransactionStatus= 'Fail' and m.ErrorMessage CONTAINS 'AAA' 
      //            and ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','') ))                                        
      //            and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
      //            and ($State = '' or ($State <>'' and n.State= $State ))                 
      //            and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //            month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      //            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
            
      //            with m.Error_Code as ErrorType, count(m.TransactionStatus) as RecCount,round( 10^2 * toFloat(count(m.TransactionStatus) *100) /toFloat(`+ Totalcount +`))/ 10^2 as Percentage 
                 
      //            return {ErrorType : ErrorType, RecCount : toString(RecCount), Percentage: toString(Percentage)} as Eligibilty271ErrorwiseCount;`;
      
      let query =`Optional MATCH (n1:EligibilityRequest {EventName: 'Request'}), (m1:EligibilityRequest {EventName :'Response'}) 
                where n1.HiPaaSUniqueID = m1.HiPaaSUniqueID  
             
                and m1.TransactionStatus= 'Fail' and m1.ErrorMessage CONTAINS 'AAA' 
                and ($Sender = '' or ($Sender <>'' and Replace(n1.Sender,' ','')= Replace($Sender,' ','') ))                                       
                and ($TransactionID = '' or ($TransactionID <>'' and n1.TransactionID contains $TransactionID)) 
                and ($State = '' or ($State <>'' and n1.State= $State )) 
                and ($ErrorType = '' or ($ErrorType <>'' and m1.ErrorMessage= $ErrorType ))             
                and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
                month: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
                Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
              
                with  count(m1) as Totalcount

                 MATCH (n:EligibilityRequest {EventName: 'Request'}), (m:EligibilityRequest {EventName :'Response'}) where  n.HiPaaSUniqueID=m.HiPaaSUniqueID  
                 and m.TransactionStatus= 'Fail' and m.ErrorMessage CONTAINS 'AAA' 
                 and ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','') ))                                        
                 and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
                 and ($State = '' or ($State <>'' and n.State= $State )) 
                 and ($ErrorType = '' or ($ErrorType <>'' and m.ErrorMessage= $ErrorType ))                  
                 and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
                 month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
                 Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
            
                 with m.Error_Code as ErrorType, count(m.TransactionStatus) as RecCount,round(toFloat(count(m.TransactionStatus) *100) /toFloat(Totalcount)) as Percentage 
                 
                 return {ErrorType : ErrorType, RecCount : toString(RecCount), Percentage: toString(Percentage)} as Eligibilty271ErrorwiseCount;`;
      

      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Eligibilty271ErrorwiseCount')})
        })
    }, 
    DashboardBarChartData(_, params) {
      let session = driver.session();      
        
      let query ="";
      if (Object.values(params)[5] =="EligibilityDatewise"){
            query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
            with  duration.indays(startDate,EndDate).Days as dur, startDate as startDate
            with [day in range(0, dur) | startDate + duration({days: day})] as months
            UNWIND months as month 
            OPTIONAL MATCH(x:EligibilityRequest)
            WHERE x.EventName = 'Request' and ($Sender = '' or ($Sender <>'' and Replace(x.Sender,' ','')= Replace($Sender,' ','') )) 
            and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
            and ($State = '' or ($State <>'' and x.State= $State ))
            AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) < date(month) + duration({ Days : 1})
            return {X_axis :toString(month), Y_axis: toString(count(x))} as DashboardBarChartData `              
      }
      else if(Object.values(params)[5] =="Eligibilitymonthwise"){
        // query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
        //     with  duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        //     with [day in range(0, dur) | startDate + duration({days: day})] as months
        //     UNWIND months as month 
        //     OPTIONAL MATCH(x:EligibilityRequest)
        //     WHERE x.EventName = 'Request' and ($Sender = '' or ($Sender <>'' and Replace(x.Sender,' ','')= Replace($Sender,' ','') )) 
        //     and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
        //     and ($State = '' or ($State <>'' and x.State= $State ))
        //     AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
        //     month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
        //     Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) < date(month) + duration({ Days : 1})
        //     return {MonthNo  : toString(month.month),Year : toString(month.year) ,
        //             X_axis :["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [month.month-1] + '-' + toString(month.year), 
        //             Y_axis: toString(count(x))} as DashboardBarChartData order by toInt(DashboardBarChartData.Year),toInt(DashboardBarChartData.MonthNo);`
        //     //return {X_axis :toString(month.month), Y_axis: toString(count(x))} as DashboardBarChartData 

        query =`OPTIONAL MATCH(x:EligibilityRequest) WHERE x.EventName = 'Request' 
                and ($Sender = '' or ($Sender <>'' and x.Sender= $Sender )) 
                and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
                and ($State = '' or ($State <>'' and x.State= $State ))
                and date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
                month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
                Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date($EndDt)
                
                WITH {CreateDateTime : date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
                month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
                Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }), Cxt: count(x)} as x,
                date($StartDt) AS startDate, date($EndDt)  as EndDate
                
                with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
                with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
                with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
            
                return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
                X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
                ,Y_axis:toString(count) } as DashboardBarChartData order by toInt(DashboardBarChartData.Year), toInt(DashboardBarChartData.MonthNo)`;
      }
      else if(Object.values(params)[5] =="Eligibilityweekwise"){
        query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
            with  duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
            with [week in range(0, dur) | startDate + duration({weeks: week})] as months
            UNWIND months as month 
            OPTIONAL MATCH(x:EligibilityRequest)
            WHERE x.EventName = 'Request' and ($Sender = '' or ($Sender <>'' and Replace(x.Sender,' ','')= Replace($Sender,' ','') )) 
            and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
            and ($State = '' or ($State <>'' and x.State= $State ))
            AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(month) + duration({ Weeks : 1})- duration({ days : 1})
            return {From : toString(date(month)),
                    X_axis :toString(date(month)) + ' - ' + toString(date(month) + duration({ Weeks : 1})- duration({ days : 1})), 
                    Y_axis: toString(count(x))} as DashboardBarChartData Order By DashboardBarChartData.From`
            // return {X_axis :toString(month.week), Y_axis: toString(count(x))} as DashboardBarChartData `              
      }
      else if(Object.values(params)[5] =="EligibilityTradingPartner" ){
        query = `MATCH (n:EligibilityRequest {EventName:'Request'})  
        where ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','')))                               
        and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
        and ($State = '' or ($State <>'' and n.State= $State ))         
        and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
        RETURN {X_axis :n.Sender, Y_axis: toString(count(n))} as DashboardBarChartData order by toInt(DashboardBarChartData.Y_axis) desc Limit 5;`;  
      }
      else if (Object.values(params)[5] =="ClaimRequestDatewise"){
        query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
        with  duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        with [day in range(0, dur) | startDate + duration({days: day})] as months
        UNWIND months as month 
        OPTIONAL MATCH(x:ClaimRequest)
        WHERE x.EventName = 'ClaimRequest' and ($Sender = '' or ($Sender <>'' and Replace(x.Sender,' ','')= Replace($Sender,' ','') )) 
        and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
        and ($State = '' or ($State <>'' and x.State= $State ))
        AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
        month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) < date(month) + duration({ Days : 1})
        return {X_axis :toString(month), Y_axis: toString(count(x))} as DashboardBarChartData `              
  }
      else if(Object.values(params)[5] =="ClaimRequestMonthwise"){
        // query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
        //     with  duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        //     with [day in range(0, dur) | startDate + duration({days: day})] as months
        //     UNWIND months as month 
        //     OPTIONAL MATCH(x:ClaimRequest)
        //     WHERE x.EventName = 'ClaimRequest' and ($Sender = '' or ($Sender <>'' and x.Sender= $Sender )) 
        //     and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
        //     and ($State = '' or ($State <>'' and x.State= $State ))
        //     AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
        //     month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
        //     Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) < date(month) + duration({ Days : 1})
        //     return {MonthNo  : toString(month.month),Year : toString(month.year) ,
        //       X_axis :["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [month.month-1] + '-' + toString(month.year), 
        //       Y_axis: toString(count(x))} as DashboardBarChartData order by toInt(DashboardBarChartData.Year),toInt(DashboardBarChartData.MonthNo);`            
            // //return {X_axis :toString(month.month), Y_axis: toString(count(x))} as DashboardBarChartData 

            query=`OPTIONAL MATCH(x:ClaimRequest) WHERE x.EventName = 'ClaimRequest' 
            and ($Sender = '' or ($Sender <>'' and x.Sender= $Sender )) 
                  and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
                  and ($State = '' or ($State <>'' and x.State= $State ))
                  and date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
                  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
                  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date($EndDt)
			
                  WITH {CreateDateTime : date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
                  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
                  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }), Cxt: count(x)} as x,
                  date($StartDt) AS startDate, date($EndDt)  as EndDate
                  
                  with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
                  with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
                  with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
              
                  return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
                  X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
                  ,Y_axis:toString(count) } as DashboardBarChartData order by toInt(DashboardBarChartData.Year), toInt(DashboardBarChartData.MonthNo);`
      }
      else if(Object.values(params)[5] =="ClaimRequestweekwise"){
        query = `WITH date($StartDt) AS startDate, date($EndDt) as EndDate
            with  duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
            with [week in range(0, dur) | startDate + duration({weeks: week})] as months
            UNWIND months as month 
            OPTIONAL MATCH(x:ClaimRequest)
            WHERE x.EventName = 'ClaimRequest' and ($Sender = '' or ($Sender <>'' and Replace(x.Sender,' ','')= Replace($Sender,' ','') )) 
            and ($TransactionID = '' or ($TransactionID <>'' and x.TransactionID contains $TransactionID))
            and ($State = '' or ($State <>'' and x.State= $State ))
            AND date(month) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(month) + duration({ Weeks : 1})- duration({ days : 1})
            return {From : toString(date(month)),
                    X_axis :toString(date(month)) + ' - ' + toString(date(month) + duration({ Weeks : 1})- duration({ days : 1})), 
                    Y_axis: toString(count(x))} as DashboardBarChartData Order By DashboardBarChartData.From`
            // return {X_axis :toString(month.week), Y_axis: toString(count(x))} as DashboardBarChartData `              
      }
      else if(Object.values(params)[5] =="ClaimRequestTradingPartner" ){
        query = `MATCH (n:ClaimRequest {EventName:'ClaimRequest'})  
        where ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','')))                               
        and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
        and ($State = '' or ($State <>'' and n.State= $State ))         
        and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
        RETURN {X_axis :case when n.Sender is null then '' else n.Sender end, Y_axis: toString(count(n))} as DashboardBarChartData;`;  
      }
      // console.log(query);        
      return session.run(query, params)
        .then(result => {
          // return result.records.map(record => {return record.get('Eligibility271_Response').properties})
          return result.records.map(record => {return record.get('DashboardBarChartData')})
        })
    },
    Trading_Partner(_, params){
      let session = driver.session();
      let query ="";  
      
      query =`MATCH (n:Trading_Partner {Trading_Partner_Name : $TPName}) 
            return {ID : toString(n.ID), 
              Trading_Partner_Name : n.Trading_Partner_Name,    
              Identifier : case when n.Identifier is null then '' else n.Identifier end,
              Functional_Ack_Options : case when n.Functional_Ack_Options is null then '' else n.Functional_Ack_Options end  ,
              Doc_Envelope_Option : case when n.Doc_Envelope_Option is null then '' else n.Doc_Envelope_Option end ,
              Element_Delimiter :  case when n.Element_Delimiter is null then '' else n.Element_Delimiter end ,
              Segment_Termination_Character : case when n.Segment_Termination_Character is null then '' else n.Segment_Termination_Character end ,
              Filter_Functional_Acknowledgments : case when n.Filter_Functional_Acknowledgments is null then false else n.Filter_Functional_Acknowledgments end ,
              Reject_Duplicate_ISA : case when n.Reject_Duplicate_ISA is null then false else n.Reject_Duplicate_ISA end ,
              Validate_Outbound_Interchanges : case when n.Validate_Outbound_Interchanges is null then false else n.Validate_Outbound_Interchanges end ,
              Outbound_Validation_Option : case when n.Outbound_Validation_Option is null then '' else n.Outbound_Validation_Option end ,              
              Authorization_Info_Qualifier : case when n.Authorization_Info_Qualifier is null then '' else n.Authorization_Info_Qualifier end ,
              Authorization_Info_ID : case when n.Authorization_Info_ID is null then '' else n.Authorization_Info_ID end  ,
              Security_Information_Qualifier : case when n.Security_Information_Qualifier is null then '' else n.Security_Information_Qualifier end  ,
              Security_Information_Id : case when n.Security_Information_Id is null then '' else n.Security_Information_Id end  ,
              Interchange_ID_Qualifier : case when n.Interchange_ID_Qualifier is null then '' else n.Interchange_ID_Qualifier end  ,
              Interchange_ID : case when n.Interchange_ID is null then '' else n.Interchange_ID end  ,
              Interchange_Standard_ID : case when n.Interchange_Standard_ID is null then '' else n.Interchange_Standard_ID end  ,
              Interchange_Version : case when n.Interchange_Version is null then '' else n.Interchange_Version end  ,
              ISA14 : case when n.ISA14 is null then false else n.ISA14 end  ,
              Test_Indicator : case when n.Test_Indicator is null then '' else n.Test_Indicator end  ,
              Component_Separator : case when n.Component_Separator is null then '' else n.Component_Separator end  ,
              X12 : case when n.X12 is null then '' else n.X12 end  ,
              Application_Code : case when n.Application_Code is null then '' else n.Application_Code end  ,
              Responsible_Agency_Code : case when n.Responsible_Agency_Code is null then '' else n.Responsible_Agency_Code end  ,
              GSVersion : case when n.GSVersion is null then '' else n.GSVersion end  ,
              Communication_Type : case when n.Communication_Type is null then '' else n.Communication_Type end  ,
              Use_Default_Settings : case when n.Use_Default_Settings is null then false else n.Use_Default_Settings end  ,
              Host : case when n.Host is null then '' else n.Host end  ,
              Port : case when n.Port is null then '' else n.Port end  ,
              UserName : case when n.UserName is null then '' else n.UserName end  ,
              Password : case when n.Password is null then '' else n.Password end  ,
              Directory : case when n.Directory is null then '' else n.Directory end  ,
              Create_Directory: case when n.Create_Directory is null then false else n.Create_Directory end  ,
              File_Naming_Options : case when n.File_Naming_Options is null then '' else n.File_Naming_Options end  
            } as Trading_Partner;`;
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Trading_Partner')})
        })
    },
    Trading_PartnerList(_, params) {
      let session = driver.session();
      let query ="";
  
      if (Object.values(params)[0] =="EligibilityStatus"){
        query ="MATCH (n:EligibilityRequest {EventName: 'Request'}) with distinct n.Sender as Sender return {Trading_Partner_Name : Sender} as Trading_Partnerlist;";
      }
      else if (Object.values(params)[0] =="ClaimRequest"){
        query ="MATCH (n:ClaimRequest {EventName: 'ClaimRequest'}) with distinct n.Sender as Sender return {Trading_Partner_Name : Sender} as Trading_Partnerlist;";
      } else if (Object.values(params)[0] =="Claim837RT"){
        query ="MATCH (n:FileIntake {Direction : $RecType }) where n.ISA06 is not null with distinct n.ISA06 as Sender return {Trading_Partner_Name : Sender} as Trading_Partnerlist;";
      }else if (Object.values(params)[0] =="TradingPartner"){
        query ="MATCH (n:Trading_Partner {Direction : $RecType}) with distinct n.Trading_Partner_Name as Sender return {Trading_Partner_Name : Sender} as Trading_Partnerlist;";
      }else if (Object.values(params)[0] =="EncounterI" || Object.values(params)[0] =="EncounterO"){
        query ="MATCH (n:EncounterFileIntake {Direction :  "+  ((Object.values(params)[0] =="EncounterI") ? "Inbound" :"Outbound" ) + " }) with distinct n.ISA06 as Sender return {Trading_Partner_Name : Sender} as Trading_Partnerlist;";
      }
      console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Trading_Partnerlist')})
        })
    },
    TransactionSetup(_, params){
      let session = driver.session();
      let query =""; 
      
      query =`Optional MATCH (n:Transaction_Setup {Trading_Partner : $TPName}) 
            return {Transaction_Type : case when n.Transaction_Type is null then '' else n.Transaction_Type end , 
              Companion_Guide : case when n.Campanion_Guide is null then '' else n.Campanion_Guide end ,    
              Acceptance_Criteria : case when n.Acceptance_Criteria is null then '' else n.Acceptance_Criteria end,
              Trading_Partner : case when n.Trading_Partner is null then $TPName else n.Trading_Partner end   
            } as TransactionSetup Limit 1 ;`;
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('TransactionSetup')})
        })
    },
    ClaimStatus276Request(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276) where n.TransactionID=$TransID RETURN n as ClaimStatus276Request;";
      let query = "MATCH (n:EligibilityRequest {EventName:'Request'})  where n.HiPaaSUniqueID=$HiPaaSUniqueID  RETURN { Message:n.Data  } as ClaimStatus276Request;";      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimStatus276Request')})
        })
    },
    ClaimStatus277Response(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276) where n.TransactionID=$TransID  RETURN n as ClaimStatus276Response;";
      // let query = "MATCH (n:EligibilityRequest) where n.HiPaaSUniqueID=$HiPaaSUniqueID and n.EventName ='Response' RETURN { Message:n.Data } as ClaimStatus276Response;";
      let query = "MATCH (n:EligibilityRequest) where n.HiPaaSUniqueID=$HiPaaSUniqueID and n.EventName ='Response' RETURN { Message:n.Data } as ClaimStatus277Response;";
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimStatus277Response')})
        })
    },
    ClaimStatusAllDtlTypewise(_, params) {
      let session = driver.session();
      // let query = "MATCH (n:ClaimStatusRequest_Header) WITH '' as Trans_CountID, '' as TypeOfTransaction , " +
      //             " '' as AvgResTime,'' as TotalNumOfReq ,'' as Success, '' as Error, "+
      //             " n.TransactionDateTime as Date ,'' as Trans_type ,n.Sender as Submiter ,n.TransactionID as Trans_ID	,   " +
      //             " '' as Error_Code  " +
      //             " RETURN  {Trans_CountID : Trans_CountID,TypeOfTransaction : TypeOfTransaction , " +
      //             " AvgResTime : AvgResTime, TotalNumOfReq: TotalNumOfReq ,Success: Success, Error : Error, " +
      //             " Date : Date , Trans_type :Trans_type ,Submiter :Submiter , Trans_ID	:Trans_ID	,   " +
      //             " Error_Code :Error_Code  } AS ClaimStatus_DateWise;";

      let query = "MATCH (n:EligibilityRequest),(m:EligibilityRequest) where n.EventName='Request' and m.EventName ='Response' " +
                  " and ( $TypeID = '' or ($TypeID <>'' and (($TypeID <> 'Fail' and (m.TransactionStatus <> 'Fail' or m.TransactionStatus IS NULL)) or ($TypeID = 'Fail' and m.TransactionStatus =$TypeID )))) "+            
                  " and n.HiPaaSUniqueID=m.HiPaaSUniqueID  WITH '' as Trans_CountID, n.HiPaaSUniqueID as HiPaaSUniqueID, '' as TypeOfTransaction , " +                  
                  " '' as AvgResTime,'' as TotalNumOfReq ,'' as Success, '' as Error, " + 
                  " n.EventCreationDateTime as Date ,m.TransactionStatus as Trans_type ,n.Sender as Submiter ,n.TransactionID as Trans_ID	,'' as Error_Code  RETURN  {HiPaaSUniqueID: HiPaaSUniqueID, Date : Date , Trans_type :Trans_type  " +
                  " ,Submiter :Submiter , Trans_ID :Trans_ID , Error_Code :Error_Code } AS ClaimStatus_DateWise "+
                  " ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimStatus_DateWise')})
        })
    },
    ClaimStatus276(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276), (m:ClaimStatusRequest_277),(o:ClaimStatusRequest_Header)  WITH '' as ID,  '' as TransactionType,'0' as AvgResTime,	 count(n) AS ncount ,'0'as Success, '0' as Error  RETURN {ID: ID, TypeofTransaction: TransactionType, AvgResTime: AvgResTime , TotalNumOfReq :toString(ncount), Success: Success, Error : Error } AS Eligibilty276;";
      let query ="MATCH (n:EligibilityRequest {EventName: 'Request'}), (m:EligibilityRequest {EventName :'Response'}) where  n.HiPaaSUniqueID=m.HiPaaSUniqueID " +  

              " With  n.HiPaaSUniqueID as Request,  m.TransactionStatus as Status," +
              " apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', 'yyyyMMdd HHmmss'), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date, " +
              " apoc.date.fields (apoc.date.format(apoc.date.parse(m.EventCreationDateTime, 'ms', 'yyyyMMdd HHmmss'), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date1 " +
              
              " With Request as Request, Status as Status, datetime({year: Date.years, month: Date.months, Day:Date.days , hour:Date.hours, minute: Date.minutes, second: Date.seconds}) as Dt1," +
              " datetime({year: Date1.years, month: Date1.months, Day:Date1.days , hour:Date1.hours, minute: Date1.minutes, second: Date1.seconds}) as Dt2 , 10^2 AS factor " +
              
              " WITH round(factor * toFloat(sum(duration.inSeconds(Dt1,Dt2).seconds))/toFloat(count(Request)))/factor as AvgResTime, count(Request) AS ncount ,sum(CASE  WHEN Status <> 'Fail' or Status IS NULL THEN 1 ELSE 0 END) as Success, sum(distinct CASE WHEN Status = 'Fail' THEN 1 ELSE 0 END)  as Error " +
              " RETURN {AvgResTime: toString(AvgResTime) ,TotalNumOfReq :toString(ncount), Success: toString(Success), Error : toString(Error) } AS ClaimStatus276;";
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimStatus276')})
        })
    },
    Claim837RTDashboardCount(_, params) {
      let session = driver.session();      
   

      // let query =`Match(n:Claims) ,(m:FileIntake) where n.FileIntakeUUID=m.FileIntakeUUID                   
      //          and ($Sender = '' or ($Sender <>'' and Replace(m.Sender,' ','')= Replace($Sender,' ','') ))  
      //          and ($State = '' or ($State <>'' and m.ExtraField9= $State ))                                         
      //          and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*'))             
      //          and ($Month =0 or ($Month <>0 and apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months=$Month))
      //          and ($Year = 0 or ($Year <>0 and  apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years=$Year))
      //          With n.ClaimID as ClaimID,10^2 AS factor, CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
      //         CASE WHEN n.ClaimStatus='Rejected' THEN  1 ELSE 0 END as Rejected  return {TotalClaims : toString(Count(ClaimID)) 
      //         ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),Accepted_Per : toString(round(factor * toFloat(sum(Accepted))*100/toFloat(count(ClaimID)))/factor), 
      //         Rejected_Per : toString(round(factor * toFloat(sum(Rejected))*100/toFloat(count(ClaimID)))/factor) } as Claim837RTDashboardCount`
      
      // n.FileIntakeUUID=m.FileIntakeUUID and
      // let query =`Optional MATCH(y:FileIntake {Direction :  $RecType})
      //             Optional Match  (n:Claims {Direction :  $RecType}) where n.FileID=y.FileID
      //             with y.FileID as FileID,count(Id(n)) as Claimcount,y.ISA06 as ISA06,y.State
      //             as State,y.GS08 as GS08 where Claimcount =0 
      //             and ('`+ Object.values(params)[0] +`' = '' or ('`+ Object.values(params)[0] +`' <>'' and State= '`+ Object.values(params)[0] +`' ))   
      //             and ('`+ Object.values(params)[1] +`' = '' or ('`+ Object.values(params)[1] +`' <>'' and Replace(ISA06,' ','')= Replace('`+ Object.values(params)[1] +`',' ','') ))         
      //             and ('`+ Object.values(params)[5] +`' = '' or ('`+ Object.values(params)[5] +`' ='P' and GS08 =~ '.*005010X222A.*') or ('`+ Object.values(params)[5] +`' ='I' and GS08 =~ '.*005010X223A.*'))
      //             With count(distinct FileID) as RejFileCount
              
      //         Match (m:FileIntake {Direction : $RecType}) 
      //         Optional Match(n:Claims {Direction : $RecType})  where n.FileID=m.FileID and                 
      //         ($Sender = '' or ($Sender <>'' and Replace(m.ISA06,' ','')= Replace($Sender,' ','') ))  
      //         and ($State = '' or ($State <>'' and m.State= $State )) 
      //         and ($Type = '' or ($Type ='P' and m.GS08 =~ '.*005010X222A.*') or ($Type ='I' and m.GS08 =~ '.*005010X223A.*'))                                          
      //         and ('`+ Object.values(params)[4] +`' = '' or ('`+ Object.values(params)[4] +`' <>'' and
      //          (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
      //         toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
      //         toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))))             
      //         and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //         month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      //         Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))
      //         With n.ClaimID as ClaimID,n.FileID as FileID,10^2 AS factor, 
      //         CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
      //         CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
      //         CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress ,
      //         CASE WHEN n.ClaimStatus IN ['Resubmit'] THEN  1 ELSE 0 END as Resubmit ,
      //         RejFileCount as RejFileID

      //          return {TotalFiles : toString(Count(distinct FileID)),TotalClaims : toString(Count(ClaimID)) 
      //           ,InProgress:toString(sum(InProgress)) 
      //         ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),
      //         Accepted_Per : toString(toFloat(sum(Accepted))*100/toFloat(count(ClaimID))), 
      //         Rejected_Per : toString(toFloat(sum(Rejected))*100/toFloat(count(ClaimID))), 
      //         Total999: toString(0), Total277CA: toString(0), TotalSentToQNXT: toString(0) ,Resubmit : toString(sum(Resubmit))
      //       ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0), 
      //       ClaimSent : toString(0), RejectedFileCount : toString(RejFileID)} as Claim837RTDashboardCount`

      let query =`Match (m:FileIntake {Direction : $RecType}) ,(n:Claims {Direction : $RecType})  where n.FileID=m.FileID and                 
              ($Sender = '' or ($Sender <>'' and Replace(m.ISA06,' ','')= Replace($Sender,' ','') ))  
              and ($State = '' or ($State <>'' and m.State= $State )) 
              and ($Type = '' or ($Type ='P' and m.GS08 =~ '.*005010X222A.*') or ($Type ='I' and m.GS08 =~ '.*005010X223A.*'))                                          
              and ('`+ Object.values(params)[4] +`' = '' or ('`+ Object.values(params)[4] +`' <>'' and
               (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
              toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
              toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))))             
              and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(n.ClaimDate) <= Date($EndDt)))
              
              return {TotalFiles : toString(Count(distinct n.FileID)),TotalClaims : toString(count(Id(n)))
                ,InProgress:toString(sum(CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END))
              ,Accepted : toString(sum(CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END)) ,
			        Rejected : toString(sum(CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END)),
              Accepted_Per : toString(toFloat(sum(CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END))*100/toFloat(count(n.ClaimID))),
              Rejected_Per : toString(toFloat(sum(CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END))*100/toFloat(count(n.ClaimID))),
              Total999: toString(0), Total277CA: toString(0), TotalSentToQNXT: toString(0) ,
			        Resubmit : toString(sum(CASE WHEN n.ClaimStatus IN ['Resubmit'] THEN  1 ELSE 0 END))
            ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0),
            ClaimSent : toString(0), RejectedFileCount : toString(0)} as Claim837RTDashboardCount`

            // let query =`Match (a:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(e:Claims {Direction : $RecType}) 
            // where ($Sender = '' or ($Sender <>'' and Replace(a.ISA06,' ','')= Replace($Sender,' ','') ))  
            //   and ($State = '' or ($State <>'' and a.State= $State )) 
            //   and ($Type = '' or ($Type ='P' and a.GS08 =~ '.*005010X222A.*') or ($Type ='I' and a.GS08 =~ '.*005010X223A.*'))                                          
            //   and ('`+ Object.values(params)[4] +`' = '' or ('`+ Object.values(params)[4] +`' <>'' and
            //    (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
            //   toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
            //   toLower(n.BillingProviderFirstName + ' ' + e.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))))             
            //   and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(e.ClaimDate) <= Date($EndDt)))

            // return {TotalFiles : toString(count(distinct a)), TotalClaims : toString(count(Id(e))),
            // Accepted : toString(sum(CASE WHEN e.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END)) ,
            // Rejected : toString(sum(CASE WHEN e.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END) ) ,
            // InProgress: toString(sum(CASE WHEN e.ClaimStatus='Validating' THEN  1 ELSE 0 END) ) ,
            // Resubmit : toString(sum(CASE WHEN e.ClaimStatus IN ['Resubmit'] THEN  1 ELSE 0 END)  ), 
            // Accepted_Per : toString(toFloat(sum(CASE WHEN e.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END))*100/toFloat(count(e.ClaimID)) ),
            // Rejected_Per : toString(toFloat(sum(CASE WHEN e.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END))*100/toFloat(count(e.ClaimID)) )
            // ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0),
            // ClaimSent : toString(0), RejectedFileCount : toString(0)} as Claim837RTDashboardCount`                        

            // let query =`Match (a:FileIntake {Direction : $RecType})-[r:HasClaims]->(e:Claims {Direction : $RecType})             
            // where ($Sender = '' or ($Sender <>'' and Replace(a.ISA06,' ','')= Replace($Sender,' ','') ))  
            //   and ($State = '' or ($State <>'' and a.State= $State )) 
            //   and ($Type = '' or ($Type ='P' and a.GS08 =~ '.*005010X222A.*') or ($Type ='I' and a.GS08 =~ '.*005010X223A.*'))                                          
            //   and ('`+ Object.values(params)[4] +`' = '' or ('`+ Object.values(params)[4] +`' <>'' and
            //    (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
            //   toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
            //   toLower(n.BillingProviderFirstName + ' ' + e.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))))             
            //   and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(e.ClaimDate) <= Date($EndDt)))
            // return {TotalFiles : toString(count(distinct a)), TotalClaims : toString(count(Id(e))),
            // Accepted : toString(sum(CASE WHEN e.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END)) ,
            // Rejected : toString(sum(CASE WHEN e.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END) ) ,
            // InProgress: toString(sum(CASE WHEN e.ClaimStatus='Validating' THEN  1 ELSE 0 END) ) ,
            // Resubmit : toString(sum(CASE WHEN e.ClaimStatus IN ['Resubmit'] THEN  1 ELSE 0 END)  ), 
            // Accepted_Per : toString(toFloat(sum(CASE WHEN e.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END))*100/toFloat(count(e.ClaimID)) ),
            // Rejected_Per : toString(toFloat(sum(CASE WHEN e.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END))*100/toFloat(count(e.ClaimID)) )
            // ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0),
            // ClaimSent : toString(0), RejectedFileCount : toString(0)} as Claim837RTDashboardCount`

            // console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Claim837RTDashboardCount')})
        })
    },
    Claim837RTClaimBarchart(_, params) {
      let session = driver.session();      
      let query ="";
      if (Object.values(params)[5]=="Monthwise")
      {
        // query =`WITH 10^2 AS factor, [date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})), date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 1}), 
        // date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 2 }),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 3}), 
        // date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 4}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 5}),
        //  date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 6}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 7}) 
        // ,date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 8}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 9}) 
        // ,date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 10}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 11})] AS timeperiod 
        //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims),(y:FileIntake) 
        //  WHERE date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
        //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Months : 1})- duration({ days : 1}) 
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.Sender,' ','')= Replace($Sender,' ','') ))  
        //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                          
        //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*')) 
        //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year), To : toString(date(time) + duration({ Months : 1})- duration({ days : 1})), 
        //  Amount: toString(round(factor * tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)) } as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
        
        //Latest

        query =`Optional MATCH (x:Claims {Direction : $RecType}),(y:FileIntake {Direction : $RecType}) where x.FileID=y.FileID 
        and date($StartDt) <=date(x.ClaimDate) <= date($EndDt)
    and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
    and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        and ($State = '' or ($State <>'' and y.State= $State ))                                          
        and ('`+ Object.values(params)[4] +`' = '' or 
              ('`+ Object.values(params)[4] +`' <>'' and
               (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
              toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
              toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
              ))   
WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
    date($StartDt) AS startDate, date($EndDt)  as EndDate
with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
,sum(case when date(time)=date(x.CreateDateTime)then x.Amount else 0 end) as Amount
         return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
         X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
         ,TotalClaims : toString(0),
         Amount: toString(Amount),
         Y_axis:toString(count) } as Claim837RTClaimBarchart order by toInt(Claim837RTClaimBarchart.Year), toInt(Claim837RTClaimBarchart.MonthNo) `

// query =`Optional Match (y:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->
//  (c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(x:Claims {Direction : $RecType})  
// where date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
//     and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
//     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
//         and ($State = '' or ($State <>'' and y.State= $State ))                                          
//         and ('`+ Object.values(params)[4] +`' = '' or 
//               ('`+ Object.values(params)[4] +`' <>'' and
//                (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
//               toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
//               toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
//               ))   
// WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
//     date($StartDt) AS startDate, date($EndDt)  as EndDate
// with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
// with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
// with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
// ,sum(case when date(time)=date(x.CreateDateTime)then x.Amount else 0 end) as Amount
//          return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
//          X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
//          ,TotalClaims : toString(0),
//          Amount: toString(Amount),
//          Y_axis:toString(count) } as Claim837RTClaimBarchart order by toInt(Claim837RTClaimBarchart.Year), toInt(Claim837RTClaimBarchart.MonthNo) `
               

// query =`Optional Match(y:FileIntake {Direction : $RecType})-[r:HasClaims]->(x:Claims {Direction : $RecType}) 
//   where date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
//     and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
//     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
//         and ($State = '' or ($State <>'' and y.State= $State ))                                          
//         and ('`+ Object.values(params)[4] +`' = '' or 
//               ('`+ Object.values(params)[4] +`' <>'' and
//                (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
//               toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
//               toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
//               ))   
// WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
//     date($StartDt) AS startDate, date($EndDt)  as EndDate
// with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
// with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
// with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
// ,sum(case when date(time)=date(x.CreateDateTime)then x.Amount else 0 end) as Amount
//          return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
//          X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
//          ,TotalClaims : toString(0),
//          Amount: toString(Amount),
//          Y_axis:toString(count) } as Claim837RTClaimBarchart order by toInt(Claim837RTClaimBarchart.Year), toInt(Claim837RTClaimBarchart.MonthNo) `
               
         //console.log(query);
      }
      else if (Object.values(params)[5]=="Weekwise")
      {
        // query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
        // with duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
        // with [week in range(0, dur) | startDate + duration({Weeks : week})] as timeperiod

        //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims) ,(y:FileIntake)  
        //  WHERE  x.FileID=y.FileID and date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
        //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) 
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
        //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                        
        //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))  
        //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
        //  To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})), 
        //  Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),
        //  X_axis: toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})), 
        //  Y_axis: toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`

        //Latest
        query =`Optional MATCH (x:Claims {Direction : $RecType}),(y:FileIntake {Direction : $RecType}) 
              where x.FileID=y.FileID and date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
            and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
            and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
                and ($State = '' or ($State <>'' and y.State= $State ))                                          
                and ('`+ Object.values(params)[4] +`' = '' or 
              ('`+ Object.values(params)[4] +`' <>'' and
               (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
              toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
              toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
              ))   
        WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
            date($StartDt) AS startDate, date($EndDt)  as EndDate
            with x,duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
            with x,[week in range(0, dur) | startDate + duration({Weeks: week})] as timeperiod UNWIND timeperiod AS time
        with time as time ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Cxt else 0 end) as count
        ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Amount else 0 end) as Amount
                return { From : toString(date(time)),To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})),
                MonthNo  : toString(date(time).month),Year : toString(date(time).year),
                X_axis:toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1}))
                ,TotalClaims : toString(0),
                Amount: toString(Amount),
                Y_axis:toString(count) } as Claim837RTClaimBarchart order by Claim837RTClaimBarchart.From `

          //       query =`Match (y:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->
          //       (d:HL22)-[*..]->(x:Claims {Direction : $RecType}) 
          //       where date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
          //       and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
          //       and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
          //         and ($State = '' or ($State <>'' and y.State= $State ))                                          
          //         and ('`+ Object.values(params)[4] +`' = '' or 
          //       ('`+ Object.values(params)[4] +`' <>'' and
          //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
          //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
          //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
          //       ))   
          // WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
          //     date($StartDt) AS startDate, date($EndDt)  as EndDate
          //     with x,duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
          //     with x,[week in range(0, dur) | startDate + duration({Weeks: week})] as timeperiod UNWIND timeperiod AS time
          // with time as time ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Cxt else 0 end) as count
          // ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Amount else 0 end) as Amount
          //         return { From : toString(date(time)),To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})),
          //         MonthNo  : toString(date(time).month),Year : toString(date(time).year),
          //         X_axis:toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1}))
          //         ,TotalClaims : toString(0),
          //         Amount: toString(Amount),
          //         Y_axis:toString(count) } as Claim837RTClaimBarchart order by Claim837RTClaimBarchart.From `


          // query =`Match (y:FileIntake {Direction : $RecType})-[r:HasClaims]->(x:Claims {Direction : $RecType})  
          //       where date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
          //       and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
          //       and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
          //         and ($State = '' or ($State <>'' and y.State= $State ))                                          
          //         and ('`+ Object.values(params)[4] +`' = '' or 
          //       ('`+ Object.values(params)[4] +`' <>'' and
          //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
          //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
          //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
          //       ))   
          // WITH {CreateDateTime : date(x.ClaimDate), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
          //     date($StartDt) AS startDate, date($EndDt)  as EndDate
          //     with x,duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
          //     with x,[week in range(0, dur) | startDate + duration({Weeks: week})] as timeperiod UNWIND timeperiod AS time
          // with time as time ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Cxt else 0 end) as count
          // ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Amount else 0 end) as Amount
          //         return { From : toString(date(time)),To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})),
          //         MonthNo  : toString(date(time).month),Year : toString(date(time).year),
          //         X_axis:toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1}))
          //         ,TotalClaims : toString(0),
          //         Amount: toString(Amount),
          //         Y_axis:toString(count) } as Claim837RTClaimBarchart order by Claim837RTClaimBarchart.From `
               
        console.log(query);
      }
      else if (Object.values(params)[5]=="Datewise")
      {
        // query =`WITH 10^2 AS factor,[date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`}))] AS timeperiod 
        //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims) ,(y:FileIntake)  
        //  WHERE date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
        //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Months : 1})- duration({ days : 1}) 
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.Sender,' ','')= Replace($Sender,' ','') ))   
        //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                        
        //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))  
        //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
        // To : toString(date(time) + duration({ Months : 1})- duration({ days : 1})), 
        // Amount: toString(round(factor * tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
        
        //Latest
        query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
        with duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        with [day in range(0, dur) | startDate + duration({days: day})] as timeperiod

         UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims {Direction : $RecType}) ,(y:FileIntake {Direction : $RecType})  
         WHERE  x.FileID=y.FileID and date(time) = date(x.ClaimDate)
         and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
         and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
         and ($State = '' or ($State <>'' and y.State= $State ))                                        
         and ('`+ Object.values(params)[4] +`' = '' or 
              ('`+ Object.values(params)[4] +`' <>'' and
               (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
              toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
              toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
              ))   
         return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
         To : toString(date(time)), 
         Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),X_axis:toString(date(time)), Y_axis:toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
         

        //  query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
        // with duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        // with [day in range(0, dur) | startDate + duration({days: day})] as timeperiod
        //  UNWIND timeperiod AS time 
        //  OPTIONAL MATCH(y:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(x:Claims {Direction : $RecType})   
        //  WHERE  date(time) = date(x.ClaimDate)
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
        //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        //  and ($State = '' or ($State <>'' and y.State= $State ))                                        
        //  and ('`+ Object.values(params)[4] +`' = '' or 
        //       ('`+ Object.values(params)[4] +`' <>'' and
        //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
        //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
        //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
        //       ))   
        //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
        //  To : toString(date(time)), 
        //  Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),X_axis:toString(date(time)), Y_axis:toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
        

        //  query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
        // with duration.indays(startDate,EndDate).Days as dur, startDate as startDate
        // with [day in range(0, dur) | startDate + duration({days: day})] as timeperiod
        //  UNWIND timeperiod AS time 
        //  OPTIONAL MATCH (y:FileIntake {Direction : $RecType})-[r:HasClaims]->(x:Claims {Direction : $RecType})    
        //  WHERE date(time) = date(x.ClaimDate)
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
        //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        //  and ($State = '' or ($State <>'' and y.State= $State ))                                        
        //  and ('`+ Object.values(params)[4] +`' = '' or 
        //       ('`+ Object.values(params)[4] +`' <>'' and
        //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
        //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
        //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
        //       ))   
        //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
        //  To : toString(date(time)), 
        //  Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),X_axis:toString(date(time)), Y_axis:toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
            
        console.log(query);
      }
      else if (Object.values(params)[5]=="Errorwise")
      {        
        query =`MATCH(x:Claims {Direction : $RecType}) ,(y:FileIntake {Direction : $RecType})  
         WHERE  x.FileID=y.FileID and size(x.ClaimsLevelError) >0 and date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
         and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
         and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
         and ($State = '' or ($State <>'' and y.State= $State ))                                        
         and ('`+ Object.values(params)[4] +`' = '' or 
              ('`+ Object.values(params)[4] +`' <>'' and
               (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
              toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
              toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
              ))   
         With x.ClaimsLevelError as ClaimLevelErrors, count(x) as ECount order by ECount desc Limit 6
         return { From : '' ,To : '', Amount: '0',TotalClaims : toString(ECount),
         X_axis:toString(ClaimLevelErrors), Y_axis:toString(ECount)} as Claim837RTClaimBarchart;`

        //  query =`Match (y:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(x:Claims {Direction : $RecType})  
        //  WHERE  size(x.ClaimsLevelError) >0 and date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
        //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        //  and ($State = '' or ($State <>'' and y.State= $State ))                                        
        //  and ('`+ Object.values(params)[4] +`' = '' or 
        //       ('`+ Object.values(params)[4] +`' <>'' and
        //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
        //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
        //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
        //       ))   
        //  With x.ClaimsLevelError as ClaimLevelErrors, count(x) as ECount order by ECount desc Limit 6
        //  return { From : '' ,To : '', Amount: '0',TotalClaims : toString(ECount),
        //  X_axis:toString(ClaimLevelErrors), Y_axis:toString(ECount)} as Claim837RTClaimBarchart;`

        //  query =`Match (y:FileIntake {Direction : $RecType})-[r:HasClaims]->(x:Claims {Direction : $RecType})  
        //  WHERE  size(x.ClaimsLevelError) >0 and date($StartDt) <= date(x.ClaimDate) <= date($EndDt)
        //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
        //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
        //  and ($State = '' or ($State <>'' and y.State= $State ))                                        
        //  and ('`+ Object.values(params)[4] +`' = '' or 
        //       ('`+ Object.values(params)[4] +`' <>'' and
        //        (toLower(x.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
        //       toLower(x.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
        //       toLower(x.BillingProviderFirstName + ' ' + x.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
        //       ))   
        //  With x.ClaimsLevelError as ClaimLevelErrors, count(x) as ECount order by ECount desc Limit 6
        //  return { From : '' ,To : '', Amount: '0',TotalClaims : toString(ECount),
        //  X_axis:toString(ClaimLevelErrors), Y_axis:toString(ECount)} as Claim837RTClaimBarchart;`         
                       
        console.log(query);
      }
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Claim837RTClaimBarchart')})
        })
    },   
    Claim837RTProcessingSummary(_, params) {
      let session = driver.session();      
      // if (Object.values(params)[9] =="")
      // {
      //   console.log("here");
      //   Object.values(params)[9]=` ORDER BY ClaimDate desc`
      // }
      console.log(Object.values(params)[9]);
      // let query =`MATCH (p:Claims {Direction : $RecType}),(q:FileIntake {Direction : $RecType})
      //       where p.FileID=q.FileID  
      //       and ($FileID = '' or ($FileID <>''  and p.FileID= $FileID ))  
      //       and ($Sender = '' or ($Sender <>'' and q.ISA06= $Sender ))  
      //       and ($Type = '' or ($Type ='P' and q.GS08 =~ '.*005010X222A.*') or ($Type ='I' and q.GS08 =~ '.*005010X223A.*'))  
      //       and ($State = '' or ($State <>'' and q.State= $State ))                                          
      //       and ($Claimstatus = '' or ($Claimstatus <>'' and p.ClaimStatus= $Claimstatus ))
            
      //       and ('`+ Object.values(params)[2] +`' = '' or 
      //       ('`+ Object.values(params)[2] +`' <>'' and
      //         (toLower(p.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or 
      //       toLower(p.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] +`.*')   or 
      //       toLower(p.BillingProviderFirstName + ' ' + p.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] +`.*'))
      //       ))
      //       and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //         month: apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      //         Day:apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
      //         With Id(p) as ClaimID
      //         With count(distinct ClaimID) as RecCount 
      //       Match(n:Claims {Direction : $RecType}) ,(y:FileIntake {Direction : $RecType})
      //       where n.FileID=y.FileID   
                   
      //       and ($FileID = '' or ($FileID <>''  and n.FileID= $FileID ))
      //       and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
      //       and ($State = '' or ($State <>'' and y.State= $State ))  
      //       and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))    
      //       and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))
      //       and ('`+ Object.values(params)[2] +`' = '' or 
      //       ('`+ Object.values(params)[2] +`' <>'' and
      //         (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or 
      //       toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] +`.*')   or 
      //       toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] +`.*'))
      //       ))    
      //       and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //       month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      //       Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
      //       Optional Match (j:ValidatorResponse) where y.FileID=j.FileID                            
      //       Optional Match (a:LX) where n.ClaimID= a.ClaimID and n.FileID= a.FileID
            
      //       With distinct RecCount as RecCount, count(a.ClaimID) as LXCount ,n.ClaimUniqueID as ClaimUniqueID, id(n) as ClaimRefId,n.FileID as FileID,
      //       n.ClaimID as ClaimID,n.CreateDateTime  as ClaimDate, 
      //       n.ClaimTMTrackingID as ClaimTMTrackingID,n.Subscriber_ID as Subscriber_ID,n.Claim_Amount as Claim_Amount, 
      //       n.ClaimStatus as ClaimStatus,n.BillingProviderLastName  as ProviderLastName,
      //       n.BillingProviderFirstName as ProviderFirstName ,
      //       n.SubscriberLastName as SubscriberLastName,n.SubscriberFirstName as SubscriberFirstName,
      //       n.adjudication_status as adjudication_status,n.ClaimsLevelError as ClaimLevelErrors
      //       ,y.FileName as FileName, y.CreateDateTime as FileCrDate, y.Status as FileStatus,y.F277 as F277,
      //       case when j.response_999 IS NULL then '' else '999' end as F999,
      //       n.Transaction_Status as Transaction_Status,n.MolinaClaimID as MolinaClaimID
      //       return { FileID: toString(FileID),RecCount: toString(RecCount),ClaimUniqueID:toString(ClaimUniqueID),
      //         ClaimID : toString(ClaimID),ClaimDate: toString(ClaimDate)
      //         ,ClaimTMTrackingID : toString(ClaimTMTrackingID), 
      //       Subscriber_ID : toString(Subscriber_ID),Claim_Amount : toString(Claim_Amount),ClaimStatus : toString(ClaimStatus)
      //       ,ProviderLastName : toString(ProviderLastName),ProviderFirstName : toString(ProviderFirstName) ,SubscriberLastName : toString(SubscriberLastName),
      //       SubscriberFirstName:toString(SubscriberFirstName),adjudication_status: toString(adjudication_status),ClaimLevelErrors:toString(ClaimLevelErrors),
      //       FileName: FileName, FileCrDate :FileCrDate, FileStatus: FileStatus ,
      //       F277: toString ( F277 )  ,F999: toString (F999)  ,TotalLine: toString(LXCount)  ,TotalLinewise835: "0"  ,BatchName: "",BatchStatus:"",        
      //       Transaction_Status: toString (Transaction_Status), ClaimRefId : toString(ClaimRefId)   ,MolinaClaimID:toString(MolinaClaimID)    
      //     } as Claim837RTProcessingSummary
      // ` +  Object.values(params)[9]  + ` SKIP ($page  - 1) * 10 LIMIT 10;`
      // //" ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
      // // Optional MATCH (z:Error_Lookup) where n.IK3=z.Error_Code and z.IK_Type='IK3'
      // //       and z.Error_Type='999' and n.ClaimStatus='Rejected'
      // //           Optional MATCH (k:Error_Lookup) where n.IK4=k.Error_Code and k.IK_Type='IK4'
      // //       and k.Error_Type='999' and n.ClaimStatus='Rejected'

      let query =`MATCH (p:Claims {Direction : $RecType}),(q:FileIntake {Direction : $RecType})
            where p.FileID=q.FileID  
            and ($FileID = '' or ($FileID <>''  and p.FileID= $FileID ))  
            and ($Sender = '' or ($Sender <>'' and q.ISA06= $Sender ))  
            and ($Type = '' or ($Type ='P' and q.GS08 =~ '.*005010X222A.*') or ($Type ='I' and q.GS08 =~ '.*005010X223A.*'))  
            and ($State = '' or ($State <>'' and q.State= $State ))                                          
            and ($Claimstatus = '' or ($Claimstatus <>'' and p.ClaimStatus= $Claimstatus ))
            
            and ('`+ Object.values(params)[2] +`' = '' or 
            ('`+ Object.values(params)[2] +`' <>'' and
              (toLower(p.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or 
            toLower(p.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] +`.*')   or 
            toLower(p.BillingProviderFirstName + ' ' + p.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] +`.*'))
            ))
            and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(p.ClaimDate) <= Date($EndDt))) 
              With count(distinct Id(p)) as RecCount
            Match(n:Claims {Direction : $RecType}) ,(y:FileIntake {Direction : $RecType})
            where n.FileID=y.FileID   
                   
            and ($FileID = '' or ($FileID <>''  and n.FileID= $FileID ))
            and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
            and ($State = '' or ($State <>'' and y.State= $State ))  
            and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))    
            and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))
            and ('`+ Object.values(params)[2] +`' = '' or 
            ('`+ Object.values(params)[2] +`' <>'' and
              (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or 
            toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] +`.*')   or 
            toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] +`.*'))
            ))    
            and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(n.ClaimDate) <= Date($EndDt))) 
            Optional Match (j:ValidatorResponse) where y.FileID=j.FileID                            
            Optional Match (a:LX) where n.ClaimID= a.ClaimID and n.FileID= a.FileID
            
            With distinct {RecCount : RecCount  , ClaimUniqueID: n.ClaimUniqueID  ,ClaimRefId : id(n) ,FileID : n.FileID,
            ClaimID : n.ClaimID,ClaimDate : n.CreateDateTime,
            ClaimTMTrackingID : n.ClaimTMTrackingID ,Subscriber_ID : n.Subscriber_ID,Claim_Amount : n.Claim_Amount,
            ClaimStatus : n.ClaimStatus  ,ProviderLastName : n.BillingProviderLastName  ,
            ProviderFirstName: n.BillingProviderFirstName   ,
            SubscriberLastName: n.SubscriberLastName  ,SubscriberFirstName: n.SubscriberFirstName  ,
            adjudication_status: n.adjudication_status ,ClaimLevelErrors: n.ClaimsLevelError  
            ,FileName : y.FileName  , FileCrDate: y.CreateDateTime ,FileStatus : y.Status ,F277: y.F277 ,
            
            Transaction_Status: n.Transaction_Status  ,MolinaClaimID : n.MolinaClaimID } as n 
            ` +  ((Object.values(params)[9] =="") ? ` ORDER BY n.ClaimDate desc` : Object.values(params)[9]  )  + `
              
      
      Optional Match (j:ValidatorResponse {FileID: n.FileID})  
      with n as n, 0 as LXCount, case when j.response_999 IS NULL then '' else '999' end as F999
            
      
            return { FileID: toString(n.FileID),RecCount: toString(n.RecCount),ClaimUniqueID:toString(n.ClaimUniqueID),
              ClaimID : toString(n.ClaimID),ClaimDate: toString(n.ClaimDate)
              ,ClaimTMTrackingID : toString(n.ClaimTMTrackingID),
            Subscriber_ID : toString(n.Subscriber_ID),Claim_Amount : toString(n.Claim_Amount),ClaimStatus : toString(n.ClaimStatus)
            ,ProviderLastName : toString(n.ProviderLastName),ProviderFirstName : toString(n.ProviderFirstName) ,SubscriberLastName : toString(n.SubscriberLastName),        
            SubscriberFirstName:toString(n.SubscriberFirstName),adjudication_status: toString(n.adjudication_status),ClaimLevelErrors:toString(n.ClaimLevelErrors),
            FileName: n.FileName, FileCrDate :n.FileCrDate, FileStatus: n.FileStatus ,
            F277: toString ( n.F277 )  ,F999: toString (F999)  ,TotalLine: toString(LXCount)  ,TotalLinewise835: "0"  ,BatchName: "",BatchStatus:"",
            Transaction_Status: toString (n.Transaction_Status), ClaimRefId : toString(n.ClaimRefId)   ,MolinaClaimID:toString(n.MolinaClaimID)
          } as Claim837RTProcessingSummary ;`
        
       console.log(query);     
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Claim837RTProcessingSummary')})
        })
    },
    EventLogData(_, params) {
      let session = driver.session();
      let query="";
      if(Object.values(params)[0] =="Eligibility"){      
          query =`MATCH (n:EligibilityRequest {EventName:'Request', HiPaaSUniqueID : $HiPaaS_UUID}) 
                  Optional Match (m:EligibilityRequest {EventName:'Response'}) 
              where n.HiPaaSUniqueID=m.HiPaaSUniqueID 
              
              with apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date,
                  apoc.date.fields (apoc.date.format(apoc.date.parse(m.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date1
              
              with datetime({year: Date.years, month: Date.months, Day:Date.days , hour:Date.hours, minute: Date.minutes, second: Date.seconds}) as Dt1,
                  datetime({year: Date1.years, month: Date1.months, Day:Date1.days , hour:Date1.hours, minute: Date1.minutes, second: Date1.seconds}) as Dt2 
                  
              with   CASE WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 'In Compliance' ELSE 'Out of Compliance' END  as Transaction_Compliance 
              Match (p:EligibilityRequest {HiPaaSUniqueID : $HiPaaS_UUID}) return  {Transaction_Compliance : Transaction_Compliance,HiPaaS_UUID: p.HiPaaSUniqueID ,EventName:  p.EventName ,EventCreationDateTime: p.EventCreationDateTime ,Exception:  p.Exception  ,ErrorMessage: p.ErrorMessage } as EventLogData order by EventLogData.EventCreationDateTime;`;
      }
      else if(Object.values(params)[0] =="ClaimRequest"){
          query =`MATCH (n:ClaimRequest {EventName:'ClaimRequest' , HiPaaSUniqueID : $HiPaaS_UUID}) 
              Optional Match (m:ClaimRequest {EventName:'Response277'}) 
              where n.HiPaaSUniqueID=m.HiPaaSUniqueID
              
              with apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date,
                  apoc.date.fields (apoc.date.format(apoc.date.parse(m.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date1
              
              with datetime({year: Date.years, month: Date.months, Day:Date.days , hour:Date.hours, minute: Date.minutes, second: Date.seconds}) as Dt1,
                  datetime({year: Date1.years, month: Date1.months, Day:Date1.days , hour:Date1.hours, minute: Date1.minutes, second: Date1.seconds}) as Dt2 
                  
              with   CASE WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 'In Compliance' ELSE 'Out of Compliance' END  as Transaction_Compliance 
              Match (p:ClaimRequest {HiPaaSUniqueID : $HiPaaS_UUID}) return  {Transaction_Compliance : Transaction_Compliance,HiPaaS_UUID: p.HiPaaSUniqueID ,EventName:  p.EventName ,EventCreationDateTime: p.EventCreationDateTime ,Exception:  p.Exception  ,ErrorMessage: p.ErrorMessage } as EventLogData order by EventLogData.EventCreationDateTime;`;
      } 
  
      return session.run(query, params)
        .then(result => {          
          return result.records.map(record => {return record.get('EventLogData')})
        })
    },
    ErrorType_List(_, params) {
      let session = driver.session();
      let query ="";
  
      // if (Object.values(params)[0] =="EligibilityStatus"){
      //   query = `MATCH (n:EligibilityRequest) where n.TransactionType='EligibilityErrors' with distinct n.ErrorMessage as ErrorType          
      //   RETURN  {ErrorType:ErrorType } as ErrorType_List;`;
      // }
      // else if (Object.values(params)[0] =="ClaimRequest"){
      //   query = `MATCH (n:ClaimRequest) where n.TransactionType='ClaimRequest' with distinct n.ErrorMessage as ErrorType          
      //   RETURN  {ErrorType:ErrorType } as ErrorType_List;`;
      // }

      query=`with ['999','AAA','TA1'] as  Error_type  UNWIND Error_type as ErrorType return  {ErrorType:ErrorType } as ErrorType_List;`
      return session.run(query, params)
        .then(result => {          
          return result.records.map(record => {return record.get('ErrorType_List')})
        })
    },
    Userrole(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276), (m:ClaimStatusRequest_277),(o:ClaimStatusRequest_Header)  WITH '' as ID,  '' as TransactionType,'0' as AvgResTime,   count(n) AS ncount ,'0'as Success, '0' as Error  RETURN {ID: ID, TypeofTransaction: TransactionType, AvgResTime: AvgResTime , TotalNumOfReq :toString(ncount), Success: Success, Error : Error } AS Eligibilty276;";
      let query ="";
      if (Object.values(params)[0] == 0){
        query =`MATCH (n:User_Role) RETURN {Role_id : tostring(id(n)), role_description :n.role_description, is_active:tostring(n.is_active)} as Userrole`;
      }
      else{
        query =`MATCH (n:User_Role) where id(n)=`+ Object.values(params)[0] +` RETURN {Role_id : tostring(id(n)), role_description :n.role_description, is_active:tostring(n.is_active)} as Userrole`;
      }
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Userrole')})
        })
    },
    User(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276), (m:ClaimStatusRequest_277),(o:ClaimStatusRequest_Header)  WITH '' as ID,  '' as TransactionType,'0' as AvgResTime,   count(n) AS ncount ,'0'as Success, '0' as Error  RETURN {ID: ID, TypeofTransaction: TransactionType, AvgResTime: AvgResTime , TotalNumOfReq :toString(ncount), Success: Success, Error : Error } AS Eligibilty276;";
      let query ="";      
      query =`MATCH (n:User) ,(m:User_Role) where n.role_id= id(m) and
      (`+ Object.values(params)[0] +` =0 or (`+ Object.values(params)[0] +`<> 0 and  id(n)=`+ Object.values(params)[0] +`)) 
      and ($Email ='' or ($Email <> '' and  n.Email=$Email)) 
      RETURN {Id : tostring(id(n)),role_id: tostring(n.role_id),  FirstName :n.FirstName , LastName : n.LastName, Email:n.Email,PhoneNumber: n.PhoneNumber,
                  PasswordHash:n.PasswordHash, is_active:tostring(n.is_Active), CreationDatetime:'', role_description: m.role_description} as User`;
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('User')})
        })
    },
    UserLogin(_, params) {
      let session = driver.session();    
      let encoded = base64encode(Object.values(params)[1]);  
      // let query = "MATCH (n:ClaimStatusRequest_276), (m:ClaimStatusRequest_277),(o:ClaimStatusRequest_Header)  WITH '' as ID,  '' as TransactionType,'0' as AvgResTime,   count(n) AS ncount ,'0'as Success, '0' as Error  RETURN {ID: ID, TypeofTransaction: TransactionType, AvgResTime: AvgResTime , TotalNumOfReq :toString(ncount), Success: Success, Error : Error } AS Eligibilty276;";
      let query ="";      
      // query =`Optional MATCH (n:User {Email:$Email, PasswordHash:'`+ encoded +`'})  
      //         RETURN { Login:case when id(n)is null then "0" else "1" end, 
      //         Id : case when id(n)is null then "0" else tostring(id(n)) end, DbTech :"GraphDb" ,
      //         role_id: tostring(n.role_id)} as UserLogin`;

      query =`Optional MATCH (n:User {Email:$Email, PasswordHash:'`+ encoded +`'})  
              RETURN { Login:case when id(n) is null then "0" when n.is_Active = 0 then "2" else "1" end, 
              Id : case when id(n) is null or n.is_Active = 0 then "0" else tostring(id(n)) end, DbTech :"GraphDb" ,
              role_id: case when id(n) is null or n.is_Active = 0 then "0" else tostring(n.role_id) end } as UserLogin`;
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('UserLogin')})
        })
    },
    ClaimRequest(_, params) {
      let session = driver.session();      
      let query = "MATCH (n:ClaimRequest {EventName:'ClaimRequest'})  where n.HiPaaSUniqueID=$HiPaaSUniqueID  RETURN { Message:n.Data  } as ClaimRequest;";
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimRequest')})
        })
    },
    ClaimStatus277(_, params) {
      let session = driver.session();      
      let query = "MATCH (n:ClaimRequest {EventName:'Response277'})  where n.HiPaaSUniqueID=$HiPaaSUniqueID  RETURN { Message:n.Data  } as ClaimStatus277;";
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimStatus277')})
        })
    },
    ClaimRequest_Datewise(_, params) {
      let session = driver.session();
      if (Object.values(params)[8] =="")
      {
        Object.values(params)[8]="Order By Date"
      }
      // let query = "MATCH (n:EligibilityRequest),(m:EligibilityRequest) where n.EventName='Request' and m.EventName ='Response' " +
      //             " and ( $TypeID = '' or ($TypeID <>'' and (($TypeID <> 'Fail' and (m.TransactionStatus <> 'Fail' or m.TransactionStatus IS NULL)) or ($TypeID = 'Fail' and m.TransactionStatus =$TypeID )))) "+            
      //             " and n.HiPaaSUniqueID=m.HiPaaSUniqueID  WITH '' as Trans_CountID, n.HiPaaSUniqueID as HiPaaSUniqueID, '' as TypeOfTransaction , " +                  
      //             " '' as AvgResTime,'' as TotalNumOfReq ,'' as Success, '' as Error, " + 
      //             " n.EventCreationDateTime as Date ,m.TransactionStatus as Trans_type ,n.Sender as Submiter ,n.TransactionID as Trans_ID  ,'' as Error_Code  RETURN  {HiPaaSUniqueID: HiPaaSUniqueID, Date : Date , Trans_type :Trans_type  " +
      //             " ,Submiter :Submiter , Trans_ID :Trans_ID , Error_Code :Error_Code } AS ClaimRequest_Datewise "+
      //             " ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
      let query = `Match (p:ClaimRequest {EventName : 'ClaimRequest'}) where 
        ($Sender = '' or ($Sender <>'' and Replace(p.Sender,' ','')= Replace($Sender,' ','') ))                    
        and ($TransactionID = '' or ($TransactionID <>'' and p.TransactionID contains $TransactionID)) 
        and ($State = '' or ($State <>'' and p.State= $State ))  
        and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        month: apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(p.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
        
        Optional Match (q:ClaimRequest {EventName : 'Response277'}) where p.HiPaaSUniqueID=q.HiPaaSUniqueID 
        and ( $TypeID = '' or ($TypeID <>'' and q.TransactionStatus =$TypeID))
        and ($ErrorType = '' or ($ErrorType <>'' and q.ErrorMessage= $ErrorType ))
        With count(p) as RecCount 

        MATCH (n:ClaimRequest {EventName :'ClaimRequest'}) Where 
        ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','') ))                   
        and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
        and ($State = '' or ($State <>'' and n.State= $State ))                   
        and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
        month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
        Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
        
        Optional Match (m:ClaimRequest {EventName :'Response277'}) where n.HiPaaSUniqueID=m.HiPaaSUniqueID        
        and ( $TypeID = '' or ($TypeID <>'' and m.TransactionStatus =$TypeID))                            
        and ($ErrorType = '' or ($ErrorType <>'' and m.ErrorMessage= $ErrorType ))
                 
        WITH RecCount as RecCount, n.HiPaaSUniqueID as HiPaaSUniqueID,                    
        '' as ErrorDescription ,'' as Error_Type ,'' as Error_Code , 
        n.EventCreationDateTime as Date ,m.TransactionStatus as Trans_type ,n.Sender as Submiter ,n.TransactionID as Trans_ID  
        
        RETURN  {RecCount: toString(RecCount), HiPaaSUniqueID: HiPaaSUniqueID, Date : Date , Trans_type :Trans_type  
        ,Submiter :Submiter , Trans_ID :Trans_ID ,Error_Type : Error_Type, Error_Code :Error_Code , ErrorDescription: ErrorDescription } AS ClaimRequest_Datewise 
        ` +  Object.values(params)[8]  + ` SKIP ($page - 1) * 10 LIMIT 10 ;`;
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimRequest_Datewise')})
        })
    },
    ClaimRequest276(_, params) {
      let session = driver.session();      
      
      let query =`Optional MATCH (n1:ClaimRequest {EventName : 'ClaimRequest'}) where       
      ($Sender = '' or ($Sender <>'' and Replace(n1.Sender,' ','')= Replace($Sender,' ','') ))                              
      and ($TransactionID = '' or ($TransactionID <>'' and n1.TransactionID contains $TransactionID)) 
      and ($State = '' or ($State <>'' and n1.State= $State ))    
      and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).year=date({year:`+ pYear +`, month:`+ pMonth +`}).year 
      and date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n1.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).month=date({year:`+ pYear +`, month:`+ pMonth +`}).month  
      with count(n1) AS LastMonth_Volume      
      
      Optional MATCH (n2:ClaimRequest {EventName : 'ClaimRequest'}) where 
      ($Sender = '' or ($Sender <>'' and Replace(n2.Sender,' ','')= Replace($Sender,' ','') ))                              
      and ($TransactionID = '' or ($TransactionID <>'' and n2.TransactionID contains $TransactionID)) 
      and ($State = '' or ($State <>'' and n2.State= $State ))    
      and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).year=date({year:`+ cYear +`, month:`+ cMonth +`}).year 
      and date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n2.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }).month=date({year:`+ cYear +`, month:`+ cMonth +`}).month  
      with  LastMonth_Volume as LastMonth_Volume, count(n2) AS ThisMonth_Volume      
      
      Optional MATCH (n3:ClaimRequest {EventName : 'ClaimRequest'}) where 
      ($Sender = '' or ($Sender <>'' and Replace(n3.Sender,' ','')= Replace($Sender,' ','') ))                              
      and ($TransactionID = '' or ($TransactionID <>'' and n3.TransactionID contains $TransactionID)) 
      and ($State = '' or ($State <>'' and n3.State= $State ))    
      and  date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n3.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days })=date()
      with LastMonth_Volume as LastMonth_Volume, ThisMonth_Volume AS ThisMonth_Volume,count(n3) AS Daily_Volume
      
      Optional MATCH (n4:ClaimRequest {EventName: 'ClaimRequest'}) 
      Where ($Sender = '' or ($Sender <>'' and Replace(n4.Sender,' ','')= Replace($Sender,' ','') )) 
      and ($TransactionID = '' or ($TransactionID <>'' and n4.TransactionID contains $TransactionID))
      and ($State = '' or ($State <>'' and n4.State= $State ))
      and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))
      
      OPTIONAL MATCH(x:ClaimRequest {EventName : 'Response277'}) 
      WHERE n4.HiPaaSUniqueID =x.HiPaaSUniqueID          
      with LastMonth_Volume as LastMonth_Volume, ThisMonth_Volume AS ThisMonth_Volume, Daily_Volume AS Daily_Volume, 
      
      n4.HiPaaSUniqueID as Request,x.HiPaaSUniqueID as Response, x.TransactionStatus as Status,x.ErrorMessage as ErrorMessage,
      apoc.date.fields (apoc.date.format(apoc.date.parse(n4.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date, 
      apoc.date.fields (apoc.date.format(apoc.date.parse(x.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')) as Date1 
       
      With LastMonth_Volume as LastMonth_Volume, ThisMonth_Volume AS ThisMonth_Volume, Daily_Volume AS Daily_Volume, 
      Request as Request, Response as Response, Status as Status, ErrorMessage as ErrorMessage, datetime({year: Date.years, month: Date.months, Day:Date.days , hour:Date.hours, minute: Date.minutes, second: Date.seconds}) as Dt1,
      datetime({year: Date1.years, month: Date1.months, Day:Date1.days , hour:Date1.hours, minute: Date1.minutes, second: Date1.seconds}) as Dt2 , 10^2 AS factor 
      
      WITH LastMonth_Volume as LastMonth_Volume, ThisMonth_Volume AS ThisMonth_Volume, Daily_Volume AS Daily_Volume, count(Request)-count(Response) as Total_NoResponse,
      round(factor * toFloat(sum(case when toString(Date(Dt2))="0000-01-01" then 0 else duration.inSeconds(Dt1,Dt2).seconds end))/toFloat(count(Request)))/factor as AvgResTime, count(Request) AS ncount ,sum(CASE  WHEN Status = 'Pass' THEN 1 ELSE 0 END) as Success, 
      sum(CASE WHEN Status = 'Fail' THEN 1 ELSE 0 END)  as Error 
      ,sum(CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 1 ELSE 0 END) as In_Compliance, sum(CASE WHEN duration.inSeconds(Dt1,Dt2).seconds > 20 THEN 1 ELSE 0 END) as out_of_Compliance, 
      sum(CASE WHEN Status ='Fail' and ErrorMessage in ['TA1','999'] THEN 1 ELSE 0 END) as Invalid_Trans , 
      case when count(Request) =0 then 0 else round(factor * toFloat(sum( CASE WHEN Status = 'Fail' THEN 1 ELSE 0 END) *100)/toFloat(count(Request)))/factor end as Error_Per,  
      case when count(Request) =0 then 0 else round(factor * toFloat(sum(CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds <= 20 THEN 1 ELSE 0 END) *100) /toFloat(count(Request)))/factor end as In_Compliance_Per, 
      case when count(Request) =0 then 0 else round(factor * toFloat(sum( CASE when toString(Date(Dt2))="0000-01-01" then 0 WHEN duration.inSeconds(Dt1,Dt2).seconds > 20 THEN 1 ELSE 0 END) *100) /toFloat(count(Request)))/factor end as out_of_Compliance_per,
      case when count(Request) =0 then 0 else round(factor * toFloat((count(Request)-count(Response))  * 100 )/toFloat(count(Request)))/factor end as NoResponse_Per, 
      case when  LastMonth_Volume  =0 then 0 else round(factor * toFloat(( ThisMonth_Volume - LastMonth_Volume ) * 100 )/ toFloat( LastMonth_Volume ))/factor end as RealTime_Per,
      sum(CASE WHEN Status = 'Paid' THEN 1 ELSE 0 END)  as Paid      
      
      RETURN {Daily_Volume :toString( Daily_Volume ) , ThisMonth_Volume: toString( ThisMonth_Volume ),	LastMonth_Volume :toString( LastMonth_Volume ), 
      In_Compliance : toString(In_Compliance) , out_of_Compliance : toString(out_of_Compliance) ,AvgResTime: toString(AvgResTime) ,TotalNumOfReq :toString(ncount), Success: toString(Success), 
      Error : toString(Error) , Total_Paid :  toString(Paid) , Error_Per : toString(Error_Per) ,NoResponse_Per : toString(NoResponse_Per) ,
      In_Compliance_Per : toString(In_Compliance_Per) ,out_of_Compliance_per : toString(out_of_Compliance_per), 
      RealTime_Per: toString(RealTime_Per), Invalid_Trans: tostring(Invalid_Trans)} AS ClaimRequest276;`;
      //  console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimRequest276')})
        })
    },
    ClaimStatuswiseCount(_, params) {
      let session = driver.session();      
      
      let query =`MATCH (n:ClaimRequest {EventName: 'ClaimRequest'}), (m:ClaimRequest {EventName :'Response277', TransactionType:'277'}) 

              where  n.HiPaaSUniqueID=m.HiPaaSUniqueID                   
              and ($Sender = '' or ($Sender <>'' and Replace(n.Sender,' ','')= Replace($Sender,' ','') ))                             
              and ($TransactionID = '' or ($TransactionID <>'' and n.TransactionID contains $TransactionID)) 
              and ($State = '' or ($State <>'' and n.State= $State ))               
              and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
              month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
              Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.EventCreationDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
              
              RETURN {ClaimStatus: m.Status, Total :toString(count(n))} AS ClaimRequest276;`;

      //  console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('ClaimRequest276')})
        })
    },
    UserwiseMenu(_, params) {
      let session = driver.session();      
      // let query = "MATCH (n:ClaimStatusRequest_276), (m:ClaimStatusRequest_277),(o:ClaimStatusRequest_Header)  WITH '' as ID,  '' as TransactionType,'0' as AvgResTime,   count(n) AS ncount ,'0'as Success, '0' as Error  RETURN {ID: ID, TypeofTransaction: TransactionType, AvgResTime: AvgResTime , TotalNumOfReq :toString(ncount), Success: Success, Error : Error } AS Eligibilty276;";
      let query ="";
      
      query =(Object.values(params)[0] == 0) ? `Match  (m:Menu_Master) `: `Match  (m:Menu_Master {is_active : 1})`;        
      query = query  + ((Object.values(params)[2] == 'S' && Object.values(params)[1] != '0') ? ` where m.menutype in [ '`+ Object.values(params)[1]+`' ,'B'] ` :` where m.menutype in [ $menutype] `) +
      ((Object.values(params)[2] == 'S' && Object.values(params)[1] != '0') ? `` :` Optional `) +`  Match (n:User_Role)-[r:HasAssigned]->(m) where id(n)=`+ Object.values(params)[0] +       
      ((Object.values(params)[2] == 'S' && Object.values(params)[1] != '0') ? ` and r.is_active=1 ` :``) +
      ` return {role_id: tostring(case when id(n) is null then `+ Object.values(params)[0] +` else id(n) end) ,
      menu_id: tostring(m.menu_id), menu_description: m.menu_description,
      sequence_id: tostring(m.sequence_id), parent_node:tostring(m.parent_node), menuflag :tostring(m.is_active) ,
      usermenuflag : tostring(case when r.is_active is null then 0 else r.is_active end) ,
      is_editor: tostring(case when r.is_editor is null then 0 else r.is_editor end) ,
      is_editable :tostring(m.is_editable), menutype :tostring(m.menutype),
      Groupid : tostring(m.Parent_sequence_id)  } 
      as UserwiseMenu order by UserwiseMenu.menutype desc, toInt(UserwiseMenu.Groupid) ,toInt(UserwiseMenu.parent_node), toInt(UserwiseMenu.sequence_id)`;
      
      console.log(query);

      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('UserwiseMenu')})
        })
    }, 
    Claim837RTDetails(_, params) {
      let session = driver.session();      
            
      let query =
     ` Match(n:Claims ) ,(y:FileIntake)
      where  n.FileID= y.FileID and n.ClaimID= $ClaimID and n.FileID=$FileID
      and id(n)=`+ Object.values(params)[2] +`
     With distinct n.ClaimID as ClaimID,n.CreateDateTime  as ClaimDate,id(n) as ClaimRefId, 
     n.ClaimTMTrackingID as ClaimTMTrackingID,n.Subscriber_ID as Subscriber_ID,n.Claim_Amount as Claim_Amount, n.ClaimStatus as ClaimStatus,n.BillingProviderLastName  as ProviderLastName,n.BillingProviderFirstName as ProviderFirstName ,
     n.SubscriberLastName as SubscriberLastName,n.SubscriberFirstName as SubscriberFirstName,n.adjudication_status as adjudication_status,n.ClaimsLevelError as ClaimLevelErrors,
     n.AdmissionDate as AdmissionDate,n.BillingProviderAddress as BillingProviderAddress,n.BillingProviderCity_State_Zip as BillingProviderCity_State_Zip,
     n.DiagnosisCodes as ICDCode,n.ClaimExtNmbr as AccidentDate   ,n.FileID as FileID,
     case when n.ClaimsLevelError contains 'ICD' then 'ICDCode' else '' end as FieldToUpdate,
  
     n.Transaction_Status as Transaction_Status,y.F277 as F277,y.F999 as F999,n.MolinaClaimID as MolinaClaimID
     
     return { ClaimID : toString(ClaimID),ClaimDate: toString(ClaimDate),ClaimTMTrackingID : toString(ClaimTMTrackingID), 
     Subscriber_ID : toString(Subscriber_ID),Claim_Amount : toString(Claim_Amount),ClaimStatus : toString(ClaimStatus)
     ,ProviderLastName : toString(ProviderLastName),ProviderFirstName : toString(ProviderFirstName) ,SubscriberLastName : toString(SubscriberLastName),
     SubscriberFirstName:toString(SubscriberFirstName),adjudication_status: toString(adjudication_status),ClaimLevelErrors:toString(ClaimLevelErrors),
     AdmissionDate:toString(AdmissionDate),BillingProviderAddress: toString(BillingProviderAddress),BillingProviderCity_State_Zip:toString(BillingProviderCity_State_Zip),
     ICDCode:toString(ICDCode),AccidentDate:toString(AccidentDate), FileID : toString(FileID), FieldToUpdate: FieldToUpdate 
     ,Transaction_Status : toString(Transaction_Status), F277: toString(Transaction_Status),F999 : toString(Transaction_Status)
     ,ClaimRefId : ToString(ClaimRefId),MolinaClaimID: toString(MolinaClaimID)
    } as Claim837RTDetails `
     
      
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Claim837RTDetails')})
        })
    },
    Claim837RTLineDetails(_, params) {
      let session = driver.session();      
            
      let query =
     `Match(n:Claims ),(y:LX)
     where n.ClaimID= y.ClaimID and
     n.FileID= y.FileID
     and  n.ClaimID= y.ClaimID
     and n.ClaimID= $ClaimID
     and n.FileID=$FileID   
     With distinct n.ClaimID as ClaimID,count(y.LX) as RecCount
     
     Match(n:Claims ),(y:LX)
     where n.ClaimID= y.ClaimID and
     n.FileID= y.FileID
     and  n.ClaimID= y.ClaimID
     and n.ClaimID= $ClaimID
     and n.FileID=$FileID   
     With distinct RecCount as RecCount, n.ClaimID as ClaimID,y.LX as ServiceLineCount,y.SVD02 as ProviderPaidAmount, y.ServiceDate as ServiceDate,y.SVD03 as ProcedureDate,y.SVD05 as PaidServiceUnitCount
     ,n.MolinaClaimID as MolinaClaimID
     return {RecCount : toString(RecCount), ClaimID : toString(ClaimID),ServiceLineCount:toString(ServiceLineCount), ProviderPaidAmount:toString(ProviderPaidAmount), 
     ServiceDate : toString(ServiceDate),ProcedureDate : toString(ProcedureDate)
     ,PaidServiceUnitCount : toString(PaidServiceUnitCount),MolinaClaimID:toString(MolinaClaimID) } as Claim837RTLineDetails 
     ORDER BY toInt(Claim837RTLineDetails.ServiceLineCount) SKIP ($page - 1) * 10 LIMIT 10`
     console.log(query);     
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Claim837RTLineDetails')})
        })
    },
  Claim837RTFileDetails(_, params) {
    let session = driver.session();      
    // if (Object.values(params)[8] =="")
    // {
    //   Object.values(params)[8]="Claim837RTFileDetails.FileDate"
    // }   
    let query = '';

    if(Object.values(params)[5] == 'RejectedFile')
    {
      query = `MATCH(y:FileIntake {Direction : $RecType}) where y.Status IN ['Error','Rejected']
     
     with y.FileID as FileID,y.ISA06 as ISA06,y.State as State,y.GS08 as GS08 
     where ('`+ Object.values(params)[1] +`' = '' or ('`+ Object.values(params)[1] +`' <>'' and State= '`+ Object.values(params)[1] +`' ))   
     and ('`+ Object.values(params)[0] +`' = '' or ('`+ Object.values(params)[0] +`' <>'' and Replace(ISA06,' ','')= Replace('`+ Object.values(params)[0] +`',' ','') ))         
     and ('`+ Object.values(params)[6] +`' = '' or ('`+ Object.values(params)[6] +`' ='P' and GS08 =~ '.*005010X222A.*') or ('`+ Object.values(params)[6] +`' ='I' and GS08 =~ '.*005010X223A.*'))
     With count(distinct FileID) as RecCount            

     MATCH(y:FileIntake {Direction : $RecType})   where y.Status IN ['Error','Rejected']  

     with RecCount as RecCount,y.Status as FileStatus,y.State as State,y.GS08 as GS08 ,
     y.FileID as FileID,y.FileName as FileName,y.ISA06 as Sender,y.ISA08 as Receiver,y.FileDate as FileDate
    ,0 as Rejected ,CASE WHEN  y.GS08 =~ '.*005010X222A.*' THEN 'Professional' ELSE CASE WHEN  y.GS08 =~ '.*005010X223A.*' THEN  'Institutional'  ELSE '' END END as Type
    
     where  ('`+ Object.values(params)[1] +`' = '' or ('`+ Object.values(params)[1] +`' <>'' and State= '`+ Object.values(params)[1] +`' ))   
     and ('`+ Object.values(params)[0] +`' = '' or ('`+ Object.values(params)[0] +`' <>'' and Replace(Sender,' ','')= Replace('`+ Object.values(params)[0] +`',' ','') ))         
     and ('`+ Object.values(params)[6] +`' = '' or ('`+ Object.values(params)[6] +`' ='P' and GS08 =~ '.*005010X222A.*') or ('`+ Object.values(params)[6] +`' ='I' and GS08 =~ '.*005010X223A.*'))
      
     with  RecCount as RecCount,FileStatus as FileStatus,FileID as FileID,FileName as FileName,Sender as Sender
    ,FileDate as FileDate,Receiver as  Receiver ,Rejected as Rejected , Type as Type

     ` +  ((Object.values(params)[8] =="") ? ` ORDER BY FileDate desc` : Object.values(params)[8]  )  + ` SKIP ($page - 1) * 10 LIMIT 10 

     return { RecCount: toString(RecCount),Claimcount : toString(0),FileStatus:toString(FileStatus),FileID:toString(FileID),FileName : toString(FileName),Sender: toString(Sender)
    ,FileDate : toString(FileDate), Receiver: toString(Receiver) ,Rejected : toString (Rejected) , Type : toString(Type) } as Claim837RTFileDetails  ;`
    } 
    else{
    
    //uncomment here 
    query = `MATCH(y:FileIntake {Direction : $RecType}),(n:Claims {Direction : $RecType}) where n.FileID=y.FileID       
     and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and y.State= $State ))          
     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))                                  
     and ($Claimstatus = '' or $Claimstatus = 'RejectedFile' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))
     and ('`+ Object.values(params)[2] + `' = '' or ('`+ Object.values(params)[2] + `' <>'' and
      (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] + `.*') or 
     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] + `.*')   or 
     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] + `.*'))
     )) 
     and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(n.ClaimDate) <= Date($EndDt))) 
      With count(distinct y.FileID) as RecCount           
      MATCH(y:FileIntake {Direction : $RecType}), (n:Claims {Direction : $RecType}) 
     where n.FileID=y.FileID  and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and y.State= $State ))    
     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
     and ($Claimstatus = '' or $Claimstatus = 'RejectedFile' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))    
     and ('`+ Object.values(params)[2] + `' = '' or 
     ('`+ Object.values(params)[2] + `' <>'' and
      (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] + `.*') or 
     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] + `.*')   or 
     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] + `.*'))
     ))
     and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date(n.ClaimDate) <= Date($EndDt))) 
    
     With distinct RecCount as RecCount,count(Id(n)) as Claimcount,y.Status as FileStatus,
     y.FileID as FileID,y.FileName as FileName,y.ISA06 as Sender,y.ISA08 as Receiver,y.FileDate as FileDate
     ,sum(CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END) as Rejected 
     ,CASE WHEN  y.GS08 =~ '.*005010X222A.*' THEN 'Professional' ELSE CASE WHEN  y.GS08 =~ '.*005010X223A.*' THEN  'Institutional'  ELSE '' END END as Type
     ` +  ((Object.values(params)[8] =="") ? ` ORDER BY FileDate desc` : Object.values(params)[8] )  +` SKIP ($page - 1) * 10 LIMIT 10  

    with RecCount as RecCount,Claimcount as Claimcount,FileStatus,FileID,FileName,Sender,FileDate,Receiver,Rejected as Rejected,Type 
    return { RecCount: toString(RecCount),Claimcount : toString(Claimcount),FileStatus:toString(FileStatus),FileID:toString(FileID),FileName : toString(FileName),Sender: toString(Sender)
    ,FileDate : toString(FileDate), Receiver: toString(Receiver) ,Rejected : toString (Rejected) , Type : toString(Type) } as Claim837RTFileDetails
      ;`
      }
      //" ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
    
    // let query = `MATCH (n:Claims {Direction : $RecType}),(y:FileIntake {Direction : $RecType})
    //  where n.FileID=y.FileID       
    //  and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
    //  and ($State = '' or ($State <>'' and n.ExtraField9= $State ))          
    //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))                                  
    //  and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))
    //  and ('`+ Object.values(params)[2] + `' = '' or 
    //  ('`+ Object.values(params)[2] + `' <>'' and
    //   (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] + `.*') or 
    //  toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] + `.*')   or 
    //  toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] + `.*'))
    //  )) 
    //  and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
    //   month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
    //   Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
    //   With distinct y.FileID   as FileID,n.ClaimID as ClaimID
    //   With count(distinct FileID) as RecCount         
    // Match(n:Claims {Direction : $RecType}) ,(y:FileIntake {Direction : $RecType})
    //  where n.FileID=y.FileID  and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
    //  and ($State = '' or ($State <>'' and n.ExtraField9= $State ))    
    //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
    //  and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))    
    //  and ('`+ Object.values(params)[2] + `' = '' or 
    //  ('`+ Object.values(params)[2] + `' <>'' and
    //   (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] + `.*') or 
    //  toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] + `.*')   or 
    //  toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] + `.*'))
    //  ))
    //  and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
    //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
    //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
    // With distinct RecCount as RecCount,n.ClaimID as Claimcount,y.Status as FileStatus,
    // y.FileID as FileID,y.FileName as FileName,y.ISA06 as Sender,y.ISA08 as Receiver,y.FileDate as FileDate
    // ,CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected 
    // ,CASE WHEN  y.GS08 =~ '.*005010X222A.*' THEN 'Professional' ELSE CASE WHEN  y.GS08 =~ '.*005010X223A.*' THEN  'Institutional'  ELSE '' END END as Type
    // return { RecCount: toString(RecCount),Claimcount : toString(count(Claimcount)),FileStatus:toString(FileStatus),FileID:toString(FileID),FileName : toString(FileName),Sender: toString(Sender)
    //   ,FileDate : toString(FileDate), Receiver: toString(Receiver) ,Rejected : toString (sum(Rejected)) , Type : toString(Type) } as Claim837RTFileDetails 
    //  `+ Object.values(params)[8] + ` SKIP ($page - 1) * 10 LIMIT 10 ;`
    //   //" ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
     
    console.log(query);     
    
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('Claim837RTFileDetails')})
      })
  }, 
  Claim835Dashboard(_, params) {
    let session = driver.session();
    // let query = "MATCH (n:FileHeader_Enrollment),(m:MemberInfo_Enrollment) RETURN n.FileName as FileName,n.FileDate as FileDate,n.ISA06 as ISA06,count(m)as mcount;";
    let query = `MATCH (n:Claims {Direction : $RecType}) 
    Optional Match (m:ClaimERAIntakeClaimSVC) where n.ClaimID=m.ClaimID and n.FileID=m.FileID
    RETURN {Claims837:Tostring(count(distinct n.ClaimID)) ,Claims835 : Tostring( count(distinct m.ClaimID)), 
     PendingClaims835: Tostring(count(distinct n.ClaimID)-count(distinct m.ClaimID))} as  Claim835Count `;
    return session.run(query,params)
      .then(result => {
        return result.records.map(record => {return record.get('Claim835Count')})
      })
  },
  Claim835Status(_, params) {
    let session = driver.session();    
    let query ='';  

    if (Object.values(params)[0] == "StatusWise") {
          query = `MATCH (n:Claims {Direction : $RecType}) 
        optional match (m:ClaimERAIntakeClaimPMT) 
        where n.ClaimID=m.CLP07 and n.FileID=m.FileID
        RETURN {X_axis: case when m.CLP02 in['1','2','19'] then 'Paid'  when  m.CLP02 in['4'] then 'Denied' else 'Pended' end,
        Y_axis : Tostring(count(distinct n.ClaimID)) } as Claim835StatusCount`
    }
    else if (Object.values(params)[0] == "PaymenttypeWise") {
      query = `MATCH (n:Claims) 
      optional match (m:ClaimERAIntakeClaimPMT) ,(p:ClaimERAIntakeFileHeader)
      where n.ClaimID=m.CLP07 and n.FileID=m.FileID and m.TransactionID=p.TransactionID 
    RETURN {X_axis: case when p.BPR04 ='ACH' then 'EFT/ERA' when p.BPR04 ='CHK' then 'Paper' when p.BPR04 is null then 'NA' else 'Other' end ,
    Y_axis: Tostring(count(distinct n.ClaimID)) } as Claim835StatusCount`
}
   console.log(query);     
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('Claim835StatusCount')})
      })
  },
  
  loopid(_, params) {
    let session = driver.session();
    let query = `Match(n:Rules {flag:$flag, transid:$transaction}) return distinct {loopid : n.loopid} as loopid;`
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('loopid')})
      })
  },
  segment(_, params) {
    let session = driver.session();
    let query = `Match(n:Rules {flag:$flag, transid:$transaction, loopid:$loopid}) return distinct {segment : n.segment} as segment;`
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('segment')})
      })
  },
  element(_, params) {
    let session = driver.session();
    let query = `Match(n:Rules {flag:$flag, transid:$transaction, loopid:$loopid, segment:$segment}) return distinct {element : n.element} as element;`
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('element')})
      })
  },
  Rules(_, params) {
    let session = driver.session();
    let query = `Match(n:Rules {transid:$transaction}) return  {seqid: tostring(n.seqid), loopid:n.loopid ,segment:n.segment,element:n.element,
                 opert:n.operator  ,value:n.value,flag:n.flag ,severity: n.severity,condition: n.condition, Ignore:tostring(n.Ignore) } as Rules;`
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('Rules')})
      })
  },    
  // Validate_Trading_Partner: () => { //
  Validate_Trading_Partner(_, params) {
    let session = driver.session();      
          
    // let query = `Optional MATCH (n:Trading_Partner {Trading_Partner_Name :$Trading_Partner_Name,	Identifier:'',	Functional_Ack_Options:'Do Not Acknowledge',	
    // Doc_Envelope_Option:'Group By Functional Group',	Element_Delimiter:'Comma Delimited',	Segment_Termination_Character:'Tilde(~)',	
    // Filter_Functional_Acknowledgments:1,	Reject_Duplicate_ISA:1,	Validate_Outbound_Interchanges:1,	
    // Outbound_Validation_Option:'',	Authorization_Info_Qualifier:'00-No Authorization Information Present',	Authorization_Info_ID:'',	
    // Security_Information_Qualifier:'00-No Security Information Present',	Security_Information_Id:'',	Interchange_ID_Qualifier:'ZZ-Mutually Defined',	
    // Interchange_ID:'MHCA330342719',	Interchange_Standard_ID:'',	Interchange_Version	:'',
    // ISA14:0,	Test_Indicator:'T-Test',	Component_Separator:':',	X12:'AAA',	Application_Code:'MHCA330342719',	
    // Responsible_Agency_Code:'',	GSVersion:'005010X220A1',	Communication_Type:'1',	
    // Use_Default_Settings:1,	Host:'https://sftp.CADHCS_5010_834.com',	Port:'22',	
    // UserName:'demouser',	Password:'Secure123#',	Directory:'',	Create_Directory:0,	
    // File_Naming_Options:'',	Transaction_Type:'',	Companion_Guide:'' })  
    // RETURN {Flag :case when id(n) is not null then true else false end } as Validate;` //RETURN {Flag : case when id(n) is not null then true else false end} as Validate;`
   
    let query = `Optional MATCH (n:TradingPartner {ISA06_ID : $ISA06_ID, PayerID : $PayerID, 
      Transaction_Code: $Transaction_Code, State :$State ,ISA08_ID :$ISA08_ID })  
    RETURN {Flag :case when n.ID is not null then true else false end } as Validate;`

    return session.run(query, params)
      .then(result => {        
        var output;
        result.records.forEach(function(record){          
          // console.log("1] record._fields[0]=",record._fields[0].Flag); 
          output= record._fields[0].Flag               
        });
        return output;        
      })
  },  
  TradingPartnerlist(_, params) {
    let session = driver.session();
    let query ="";  
    let Orderby ="";  
    if (Object.values(params)[0] == 0) {
      if (Object.values(params)[2] == "") {
        Orderby = "toInt(TradingPartnerlist.ID)"
      }
      else {
        Orderby = Object.values(params)[2]
      }

      query = `Optional MATCH (m:TradingPartner {Is_Active : 1}) 

      where ($PayerID = '' or ($PayerID <>'' and m.PayerID contains $PayerID))                                        
      and ($PayerName = '' or ($PayerName <>'' and m.PayerName contains $PayerName))        
      and ($ISA06_ID = '' or ($ISA06_ID <>'' and m.ISA06_ID contains $ISA06_ID))                                        
      and ($ISA06_Name = '' or ($ISA06_Name <>'' and m.ISA06_Name contains $ISA06_Name))   
      and ($ISA08_ID = '' or ($ISA08_ID <>'' and m.ISA08_ID contains $ISA08_ID))                                        
      and ($ISA08_Name = '' or ($ISA08_Name <>'' and m.ISA08_Name contains $ISA08_Name))                                
      and ($Transaction = '' or ($Transaction <>'' and m.Transaction_Code = $Transaction)) 
      and ($State = '' or ($State <>'' and m.State= $State ))    
      with count(m) as count 

      MATCH (n:TradingPartner {Is_Active : 1})       
      where ($PayerID = '' or ($PayerID <>'' and n.PayerID contains $PayerID))                                        
      and ($PayerName = '' or ($PayerName <>'' and n.PayerName contains $PayerName))   
      and ($ISA06_ID = '' or ($ISA06_ID <>'' and n.ISA06_ID contains $ISA06_ID))                                        
      and ($ISA06_Name = '' or ($ISA06_Name <>'' and n.ISA06_Name contains $ISA06_Name))   
      and ($ISA08_ID = '' or ($ISA08_ID <>'' and n.ISA08_ID contains $ISA08_ID))                                        
      and ($ISA08_Name = '' or ($ISA08_Name <>'' and n.ISA08_Name contains $ISA08_Name))                                     
      and ($Transaction = '' or ($Transaction <>'' and n.Transaction_Code = $Transaction)) 
      and ($State = '' or ($State <>'' and n.State= $State ))    
      
          return {Rcount : ToString(count) , ID : toString(n.ID), ISA06_ID : n.ISA06_ID, Transaction_Code : n.Transaction_Code,
            State : n.State , ISA08_ID : n.ISA08_ID, PayerName: n.PayerName, PayerID: n.PayerID,
            ISA06_Name :n.ISA06_Name, ISA08_Name :n.ISA08_Name, TradingPartnerName :n.TradingPartnerName,
            Is_Active :toString(n.Is_Active) } as TradingPartnerlist 
            ORDER BY `+ Orderby + ` SKIP ($page - 1) * 10 LIMIT 10;`;
    }
    else {
      query = `MATCH (n:TradingPartner {ID :` + Object.values(params)[0] + ` , Is_Active : 1}) 
      return {Rcount : "1" , ID : toString(n.ID), ISA06_ID : n.ISA06_ID, Transaction_Code : n.Transaction_Code,
        State : n.State , ISA08_ID : n.ISA08_ID, PayerName: n.PayerName, PayerID: n.PayerID,
        ISA06_Name :n.ISA06_Name, ISA08_Name :n.ISA08_Name, TradingPartnerName :n.TradingPartnerName,
        Is_Active :toString(n.Is_Active) } as TradingPartnerlist;`;
    }    
    return session.run(query,params)
      .then(result => {
        return result.records.map(record => {return record.get('TradingPartnerlist')})
      })
  },
  


  StateList(_, params) {
    let session = driver.session();          
    let query ="";            
  
  if (Object.values(params)[1] == 1){
  query =`MATCH (n:User),(m:State) where Id(n) =`+ Object.values(params)[0] + ` and n.State=m.State RETURN {State: n.State, StateCode:m.StateCode} as StateList order by StateList.State`;
    }
  else{
  query =`MATCH (n:M_State) RETURN {State: n.State, StateCode: n.StateCode} as StateList order by StateList.State `;
  }
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('StateList')})
      })
  },
  EncounterDashboardCount(_, params) {
    let session = driver.session();      
 

    // let query =`Match(n:Claims) ,(m:FileIntake) where n.FileIntakeUUID=m.FileIntakeUUID                   
    //          and ($Sender = '' or ($Sender <>'' and Replace(m.Sender,' ','')= Replace($Sender,' ','') ))  
    //          and ($State = '' or ($State <>'' and m.ExtraField9= $State ))                                         
    //          and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*'))             
    //          and ($Month =0 or ($Month <>0 and apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months=$Month))
    //          and ($Year = 0 or ($Year <>0 and  apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years=$Year))
    //          With n.ClaimID as ClaimID,10^2 AS factor, CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
    //         CASE WHEN n.ClaimStatus='Rejected' THEN  1 ELSE 0 END as Rejected  return {TotalClaims : toString(Count(ClaimID)) 
    //         ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),Accepted_Per : toString(round(factor * toFloat(sum(Accepted))*100/toFloat(count(ClaimID)))/factor), 
    //         Rejected_Per : toString(round(factor * toFloat(sum(Rejected))*100/toFloat(count(ClaimID)))/factor) } as Claim837RTDashboardCount`
    
    // n.FileIntakeUUID=m.FileIntakeUUID and
    let query =`Optional Match(n:EncounterClaims {Direction : $RecType}) ,(m:EncounterFileIntake {Direction : $RecType}) where n.FileID=m.FileID and                 
            ($Sender = '' or ($Sender <>'' and Replace(m.ISA06,' ','')= Replace($Sender,' ','') ))  
            and ($State = '' or ($State <>'' and n.ExtraField9= $State )) 
            and ($Type = '' or ($Type ='P' and m.GS08 =~ '.*005010X222A.*') or ($Type ='I' and m.GS08 =~ '.*005010X223A.*'))                                          
            and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*'))             
            and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
            month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
            Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))
            With n.ClaimID as ClaimID,n.FileID as FileID,10^2 AS factor, 
            CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
            CASE WHEN n.ClaimStatus='Rejected' THEN  1 ELSE 0 END as Rejected ,
            CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress 
             return {TotalFiles : toString(Count(distinct FileID)),TotalClaims : toString(Count(ClaimID)) 
              ,InProgress:toString(sum(InProgress)) 
            ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),
            Accepted_Per : toString(toFloat(sum(Accepted))*100/toFloat(count(ClaimID))), 
            Rejected_Per : toString(toFloat(sum(Rejected))*100/toFloat(count(ClaimID))), 
            Total999: toString(0), Total277CA: toString(0), TotalSentToQNXT: toString(0) } as EncounterDashboardCount`
                      
            // console.log(query);
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterDashboardCount')})
      })
  },
  EncounterClaimBarchart(_, params) {
    let session = driver.session();      
    let query ="";
    if (Object.values(params)[5]=="Monthwise")
    {
      // query =`WITH 10^2 AS factor, [date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})), date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 1}), 
      // date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 2 }),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 3}), 
      // date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 4}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 5}),
      //  date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 6}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 7}) 
      // ,date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 8}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 9}) 
      // ,date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 10}),date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`})) - duration({Months : 11})] AS timeperiod 
      //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims),(y:FileIntake) 
      //  WHERE date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Months : 1})- duration({ days : 1}) 
      //  and ($Sender = '' or ($Sender <>'' and Replace(y.Sender,' ','')= Replace($Sender,' ','') ))  
      //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                          
      //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*')) 
      //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year), To : toString(date(time) + duration({ Months : 1})- duration({ days : 1})), 
      //  Amount: toString(round(factor * tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)) } as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
      
      query =`Optional MATCH (x:EncounterClaims {Direction : $RecType}),(y:EncounterFileIntake {Direction : $RecType}) where x.FileID=y.FileID and date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date($EndDt)
  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
      and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                          
      and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))     
WITH {CreateDateTime : date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
  date($StartDt) AS startDate, date($EndDt)  as EndDate
with x,duration.indays(startDate,EndDate).Days as dur, startDate as startDate
with x,[day in range(0, dur) | startDate + duration({days: day})] as timeperiod UNWIND timeperiod AS time
with date(time).month as time ,date(time).year as year,sum(case when date(time)=date(x.CreateDateTime)then x.Cxt else 0 end) as count
,sum(case when date(time)=date(x.CreateDateTime)then x.Amount else 0 end) as Amount
       return { From : toString(0),To : toString(0),MonthNo  : toString(time),Year : toString(year) , 
       X_axis:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] [time-1] + '-' + toString(year)
       ,TotalClaims : toString(0),
       Amount: toString(Amount),
       Y_axis:toString(count) } as EncounterClaimBarchart order by toInt(EncounterClaimBarchart.Year), toInt(EncounterClaimBarchart.MonthNo) `
             
       //console.log(query);
    }
    else if (Object.values(params)[5]=="Weekwise")
    {
      // query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
      // with duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
      // with [week in range(0, dur) | startDate + duration({Weeks : week})] as timeperiod

      //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims) ,(y:FileIntake)  
      //  WHERE  x.FileID=y.FileID and date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) 
      //  and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
      //  and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
      //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                        
      //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))  
      //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
      //  To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})), 
      //  Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),
      //  X_axis: toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})), 
      //  Y_axis: toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
    
      query =`Optional MATCH (x:EncounterClaims {Direction : $RecType}),(y:EncounterFileIntake {Direction : $RecType}) where x.FileID=y.FileID and date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
              month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
              Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date($EndDt)
          and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))  
          and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
              and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                          
              and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))     
      WITH {CreateDateTime : date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
              month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
              Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }), Cxt: count(x),Amount:round(tofloat(sum(tofloat(x.Claim_Amount))))  } as x,
          date($StartDt) AS startDate, date($EndDt)  as EndDate
          with x,duration.indays(startDate,EndDate).weeks as dur, startDate as startDate
          with x,[week in range(0, dur) | startDate + duration({Weeks: week})] as timeperiod UNWIND timeperiod AS time
      with time as time ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Cxt else 0 end) as count
      ,sum(case when date(time)<= date(x.CreateDateTime) <= date(time) + duration({ Weeks : 1})- duration({ days : 1}) then x.Amount else 0 end) as Amount
              return { From : toString(date(time)),To : toString(date(time) + duration({ Weeks : 1})- duration({ days : 1})),
              MonthNo  : toString(date(time).month),Year : toString(date(time).year),
              X_axis:toString(date(time)) + ' - ' + toString(date(time) + duration({ Weeks : 1})- duration({ days : 1}))
              ,TotalClaims : toString(0),
              Amount: toString(Amount),
              Y_axis:toString(count) } as EncounterClaimBarchart order by EncounterClaimBarchart.From `
             
      console.log(query);
    }
    else if (Object.values(params)[5]=="Datewise")
    {
      // query =`WITH 10^2 AS factor,[date(datetime({year:`+ Object.values(params)[0] +`,month:`+ Object.values(params)[1] +`}))] AS timeperiod 
      //  UNWIND timeperiod AS time OPTIONAL MATCH(x:Claims) ,(y:FileIntake)  
      //  WHERE date(time) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      //  month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      //  Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= date(time) + duration({ Months : 1})- duration({ days : 1}) 
      //  and ($Sender = '' or ($Sender <>'' and Replace(y.Sender,' ','')= Replace($Sender,' ','') ))   
      //  and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                        
      //  and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))  
      //  return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
      // To : toString(date(time) + duration({ Months : 1})- duration({ days : 1})), 
      // Amount: toString(round(factor * tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x))} as Claim837RTClaimBarchart Order By Claim837RTClaimBarchart.From`
      
      query =`WITH  date($StartDt) AS startDate, date($EndDt)  as EndDate
      with duration.indays(startDate,EndDate).Days as dur, startDate as startDate
      with [day in range(0, dur) | startDate + duration({days: day})] as timeperiod

       UNWIND timeperiod AS time OPTIONAL MATCH(x:EncounterClaims {Direction : $RecType}) ,(y:EncounterFileIntake {Direction : $RecType})  
       WHERE  x.FileID=y.FileID and date(time) = date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
       month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
       Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) 
       and ($Sender = '' or ($Sender <>'' and Replace(y.ISA06,' ','')= Replace($Sender,' ','') ))   
       and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
       and ($State = '' or ($State <>'' and x.ExtraField9= $State ))                                        
       and ($Provider = '' or ($Provider <>'' and x.BillingProviderLastName =~ '.*$Provider.*'))  
       return { From : toString(date(time)),MonthNo : toString(date(time).month),Year : toString(date(time).year) , 
       To : toString(date(time)), 
       Amount: toString(round(tofloat(sum(tofloat(x.Claim_Amount))))),TotalClaims : toString(count(x)),X_axis:toString(date(time)), Y_axis:toString(count(x))} as EncounterClaimBarchart Order By EncounterClaimBarchart.From`
                     
      console.log(query);
    }
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterClaimBarchart')})
      })
  },   
  EncounterProcessingSummary(_, params) {
    let session = driver.session();      
    if (Object.values(params)[9] =="")
    {
      Object.values(params)[9]=" ORDER BY EncounterProcessingSummary.ClaimDate desc"
    }
    let query =`MATCH (p:EncounterClaims {Direction : $RecType}),(q:EncounterFileIntake {Direction : $RecType})
     where p.FileID=q.FileID  
     and ($FileID = '' or ($FileID <>''  and p.FileID= $FileID ))  
     and ($Sender = '' or ($Sender <>'' and q.ISA06= $Sender ))  
     and ($Type = '' or ($Type ='P' and q.GS08 =~ '.*005010X222A.*') or ($Type ='I' and q.GS08 =~ '.*005010X223A.*'))  
     and ($State = '' or ($State <>'' and p.ExtraField9= $State ))                                          
     and ($Claimstatus = '' or ($Claimstatus <>'' and p.ClaimStatus= $Claimstatus ))
     and ($Provider = '' or ($Provider <>'' and p.BillingProviderLastName =~ '.*$Provider.*')) 
     and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(p.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
      With p.ClaimID as ClaimID
      With count(ClaimID) as RecCount 
    Match(n:EncounterClaims {Direction : $RecType}) ,(y:EncounterFileIntake {Direction : $RecType})
     where n.FileID=y.FileID   and ($FileID = '' or ($FileID <>''  and n.FileID= $FileID ))
     and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and n.ExtraField9= $State ))  
     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))    
     and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))    
     and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*')) and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
     month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
     Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
    With distinct RecCount as RecCount,n.ClaimUniqueID as ClaimUniqueID,n.FileID as FileID,n.ClaimID as ClaimID,n.CreateDateTime  as ClaimDate, 
    n.ClaimTMTrackingID as ClaimTMTrackingID,n.Subscriber_ID as Subscriber_ID,n.Claim_Amount as Claim_Amount, n.ClaimStatus as ClaimStatus,n.BillingProviderLastName  as ProviderLastName,n.BillingProviderFirstName as ProviderFirstName ,
    n.SubscriberLastName as SubscriberLastName,n.SubscriberFirstName as SubscriberFirstName,n.adjudication_status as adjudication_status,n.ClaimLevelErrors as ClaimLevelErrors
    ,y.FileName as FileName, y.CreateDateTime as FileCrDate, y.Status as FileStatus
    return { FileID: toString(FileID),RecCount: toString(RecCount),ClaimUniqueID:toString(ClaimUniqueID),
      ClaimID : toString(ClaimID),ClaimDate: toString(ClaimDate)
      ,ClaimTMTrackingID : toString(ClaimTMTrackingID), 
    Subscriber_ID : toString(Subscriber_ID),Claim_Amount : toString(Claim_Amount),ClaimStatus : toString(ClaimStatus)
    ,ProviderLastName : toString(ProviderLastName),ProviderFirstName : toString(ProviderFirstName) ,SubscriberLastName : toString(SubscriberLastName),
    SubscriberFirstName:toString(SubscriberFirstName),adjudication_status: toString(adjudication_status),ClaimLevelErrors:toString(ClaimLevelErrors),
    FileName: FileName, FileCrDate :FileCrDate, FileStatus: FileStatus  } as EncounterProcessingSummary 
    ` +  Object.values(params)[9]  + ` SKIP ($page  - 1) * 10 LIMIT 10;`
    //" ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
      
     console.log(query);     
    
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterProcessingSummary')})
      })
  },
  FileInCount(_, params) {
    let session = driver.session();   
    let query =`Optional Match(n:Claims {Direction : $RecType}) ,(m:FileIntake {Direction : $RecType}) 
    where n.FileID=m.FileID and                 
            ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') ))  
            and ($State = '' or ($State <>'' and m.State= $State ))  
            and ('`+ Object.values(params)[4] +`' = '' or 
            ('`+ Object.values(params)[4] +`' <>'' and
            (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
            toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
            toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
            ))
                     
            and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.ClaimDate) <= Date($ToDt)))
            Optional Match (j:ValidatorResponse) where m.FileID=j.FileID  

            With n.ClaimID as ClaimID,n.FileID as FileID,
            CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
            CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
            CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress ,
            CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
            CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
            CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
            CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as TotalBatch ,0 as ReadytoSend, 0 as Valid
            , 0 as Error
             , 0 as ClaimSent   
             , case when j.response_999 IS NULL then '' else j.FileID end as F999                        
            return {totalFile : toString(Count(distinct FileID)),TotalClaims : toString(Count(ClaimID))
            ,InProgress:toString(sum(InProgress)),
            Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),            
            Total999: toString(count(distinct F999)), Total277CA: toString(0), TotalSentToQNXT: toString(0) ,Paid : toString(sum(Paid)),
            denied : toString(sum(denied)),  WIP : toString(sum(WIP)), Pending : toString(sum(Pending))
          ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0), 
          ClaimSent : toString(0)} as FileInCount`
    
          // let query =`Optional Match (m:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(n:Claims {Direction : $RecType}) 
          // where n.FileID=m.FileID and                 
          //         ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') ))  
          //         and ($State = '' or ($State <>'' and m.State= $State ))  
          //         and ('`+ Object.values(params)[4] +`' = '' or 
          //         ('`+ Object.values(params)[4] +`' <>'' and
          //         (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
          //         toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
          //         toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
          //         ))
                           
          //         and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.ClaimDate) <= Date($ToDt)))
          //         Optional Match (j:ValidatorResponse) where m.FileID=j.FileID  
      
          //         With n.ClaimID as ClaimID,n.FileID as FileID,
          //         CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
          //         CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
          //         CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress ,
          //         CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
          //         CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
          //         CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
          //         CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as TotalBatch ,0 as ReadytoSend, 0 as Valid
          //         , 0 as Error
          //          , 0 as ClaimSent   
          //          , case when j.response_999 IS NULL then '' else j.FileID end as F999                        
          //         return {totalFile : toString(Count(distinct FileID)),TotalClaims : toString(Count(ClaimID))
          //         ,InProgress:toString(sum(InProgress)),
          //         Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),            
          //         Total999: toString(count(distinct F999)), Total277CA: toString(0), TotalSentToQNXT: toString(0) ,Paid : toString(sum(Paid)),
          //         denied : toString(sum(denied)),  WIP : toString(sum(WIP)), Pending : toString(sum(Pending))
          //       ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0), 
          //       ClaimSent : toString(0)} as FileInCount`
          
          // let query =`Optional Match (m:FileIntake {Direction : $RecType})-[r:HasClaims]->(n:Claims {Direction : $RecType}) 
          // where n.FileID=m.FileID and                 
          //         ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') ))  
          //         and ($State = '' or ($State <>'' and m.State= $State ))  
          //         and ('`+ Object.values(params)[4] +`' = '' or 
          //         ('`+ Object.values(params)[4] +`' <>'' and
          //         (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[4] +`.*') or 
          //         toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[4] +`.*')   or 
          //         toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[4] +`.*'))
          //         ))
                           
          //         and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.ClaimDate) <= Date($ToDt)))
          //         Optional Match (j:ValidatorResponse) where m.FileID=j.FileID  
      
          //         With n.ClaimID as ClaimID,n.FileID as FileID,
          //         CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
          //         CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
          //         CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress ,
          //         CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
          //         CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
          //         CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
          //         CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as TotalBatch ,0 as ReadytoSend, 0 as Valid
          //         , 0 as Error
          //          , 0 as ClaimSent   
          //          , case when j.response_999 IS NULL then '' else j.FileID end as F999                        
          //         return {totalFile : toString(Count(distinct FileID)),TotalClaims : toString(Count(ClaimID))
          //         ,InProgress:toString(sum(InProgress)),
          //         Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),            
          //         Total999: toString(count(distinct F999)), Total277CA: toString(0), TotalSentToQNXT: toString(0) ,Paid : toString(sum(Paid)),
          //         denied : toString(sum(denied)),  WIP : toString(sum(WIP)), Pending : toString(sum(Pending))
          //       ,TotalBatch : toString(0),ReadytoSend : toString(0),Valid : toString(0), Error : toString(0), 
          //       ClaimSent : toString(0)} as FileInCount`
          
                     
    return session.run(query, params)
    
      .then(result => {
        return result.records.map(record => {return record.get('FileInCount')})
      })
  },

  EncounterDetails(_, params) {
    let session = driver.session();      
          
    let query =
   ` Match(n:EncounterClaims {Direction : $RecType}) ,(y:EncounterFileIntake {Direction : $RecType})
    where  n.FileID= y.FileID and n.ClaimID= $ClaimID and n.FileID=$FileID
    
   With distinct n.ClaimID as ClaimID,n.CreateDateTime  as ClaimDate, 
   n.ClaimTMTrackingID as ClaimTMTrackingID,n.Subscriber_ID as Subscriber_ID,n.Claim_Amount as Claim_Amount, n.ClaimStatus as ClaimStatus,n.BillingProviderLastName  as ProviderLastName,n.BillingProviderFirstName as ProviderFirstName ,
   n.SubscriberLastName as SubscriberLastName,n.SubscriberFirstName as SubscriberFirstName,n.adjudication_status as adjudication_status,n.ClaimLevelErrors as ClaimLevelErrors,
   n.AdmissionDate as AdmissionDate,n.BillingProviderAddress as BillingProviderAddress,n.BillingProviderCity_State_Zip as BillingProviderCity_State_Zip,
   n.DiagnosisCodes as ICDCode,n.ClaimExtNmbr as AccidentDate , n.FileID as FileID  ,
   case when n.ClaimLevelErrors contains 'ICD' then 'ICDCode' else '' end as FieldToUpdate
   
   return { ClaimID : toString(ClaimID),ClaimDate: toString(ClaimDate),ClaimTMTrackingID : toString(ClaimTMTrackingID), 
   Subscriber_ID : toString(Subscriber_ID),Claim_Amount : toString(Claim_Amount),ClaimStatus : toString(ClaimStatus)
   ,ProviderLastName : toString(ProviderLastName),ProviderFirstName : toString(ProviderFirstName) ,SubscriberLastName : toString(SubscriberLastName),
   SubscriberFirstName:toString(SubscriberFirstName),adjudication_status: toString(adjudication_status),ClaimLevelErrors:toString(ClaimLevelErrors),
   AdmissionDate:toString(AdmissionDate),BillingProviderAddress: toString(BillingProviderAddress),BillingProviderCity_State_Zip:toString(BillingProviderCity_State_Zip),
   ICDCode:toString(ICDCode),AccidentDate:toString(AccidentDate), FileID : toString(FileID), FieldToUpdate : FieldToUpdate
  } as EncounterDetails `
   
    
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterDetails')})
      })
  }, 
  EncounterLineDetails(_, params) {
    let session = driver.session();      
          
    let query =
   ` Match(n:EncounterClaims {Direction : $RecType}),(y:EncounterLX)
   where n.ClaimID= y.ClaimID and
   n.FileID= y.FileID
   and  n.ClaimID= y.ClaimID
   and n.ClaimID= $ClaimID
   and n.FileID=$FileID
   With distinct n.ClaimID as ClaimID,y.LX as ServiceLineCount,y.SVD02 as ProviderPaidAmount, y.ServiceDate as ServiceDate,y.SVD03 as ProcedureDate,y.SVD05 as PaidServiceUnitCount
   return { ClaimID : toString(ClaimID),ServiceLineCount:toString(ServiceLineCount), ProviderPaidAmount:toString(ProviderPaidAmount), 
   ServiceDate : toString(ServiceDate),ProcedureDate : toString(ProcedureDate)
   ,PaidServiceUnitCount : toString(PaidServiceUnitCount) } as EncounterLineDetails `
   console.log(query);     
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterLineDetails')})
      })
  },
  EncounterFileDetails(_, params) {
    let session = driver.session();      
    if (Object.values(params)[8] =="")
    {
      Object.values(params)[8]="EncounterFileDetails.FileDate"
    }
    let query =`MATCH (n:EncounterClaims {Direction : $RecType}),(y:EncounterFileIntake {Direction : $RecType})
     where n.FileID=y.FileID       
     and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and n.ExtraField9= $State ))          
     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))                                  
     and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))
     and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*')) and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
      With distinct y.FileID   as FileID,n.ClaimID as ClaimID
      With count(distinct FileID) as RecCount         
    Match(n:EncounterClaims {Direction : $RecType}) ,(y:EncounterFileIntake {Direction : $RecType})
     where n.FileID=y.FileID  and ($Sender = '' or ($Sender <>'' and y.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and n.ExtraField9= $State ))    
     and ($Type = '' or ($Type ='P' and y.GS08 =~ '.*005010X222A.*') or ($Type ='I' and y.GS08 =~ '.*005010X223A.*'))  
     and ($Claimstatus = '' or ($Claimstatus <>'' and n.ClaimStatus= $Claimstatus ))    
     and ($Provider = '' or ($Provider <>'' and n.BillingProviderLastName =~ '.*$Provider.*')) and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
     month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
     Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.CreateDateTime, 'ms',"yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt))) 
    With distinct RecCount as RecCount,count(n.ClaimID) as Claimcount,y.Status as FileStatus,
    y.FileID as FileID,y.FileName as FileName,y.ISA06 as Sender,y.FileDate as FileDate
    return { RecCount: toString(RecCount),Claimcount : toString(Claimcount),FileStatus:toString(FileStatus),FileID:toString(FileID),FileName : toString(FileName),Sender: toString(Sender)
      ,FileDate : toString(FileDate)} as EncounterFileDetails 
     `+ Object.values(params)[8] + ` SKIP ($page - 1) * 10 LIMIT 10 ;`
    //" ORDER BY HiPaaSUniqueID SKIP ($page - 1) * 10 LIMIT 10 ;";
      
     console.log(query);     
    
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('EncounterFileDetails')})
      })
  }, 
  ClaimsICDCODE: () => {
    let session = driver.session();
    
    let query = `MATCH (n:Claims_ICD_CODE)       
    RETURN {SeqId:Tostring(Id(n)) ,ICD_CODE : n.ICD_CODE, 
      Year: Tostring(case when n.Year is null then '' else n.Year end), ExtraField1: n.ExtraField1} as  ClaimsICDCODE `;
    return session.run(query)
      .then(result => {
        return result.records.map(record => {return record.get('ClaimsICDCODE')})
      })
  },
  TransactionMaster(_, params) {
    let session = driver.session();      
    
    let query =`MATCH (n:TransactionMaster) where n.is_active=true With n.Trans_Code as Trans_Code,n.Transaction_Type as Transaction_Type   
             RETURN {Trans_Code: toString(Trans_Code) ,Transaction_Type :toString(Transaction_Type)} as TransactionMaster`;
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('TransactionMaster')})
      })
  },
  ClaimsDailyAudit(_, params) {
    let session = driver.session();   
    let Orderby ='';
    if (Object.values(params)[6] == "") {
      Orderby = "ClaimsDailyAudit.FileID desc"
    }
    else {
      Orderby = Object.values(params)[6]
    }
  
    let query =`Optional Match(n:Claims {Direction : $RecType}) ,(m:FileIntake {Direction : $RecType}) 
    where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    and ($State = '' or ($State <>'' and m.State= $State )) 
    and ('`+ Object.values(params)[5] +`' = '' or 
        ('`+ Object.values(params)[5] +`' <>'' and
         (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
        toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
        toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
        ))
    and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    With case when m.FileID is not null then m.FileID else n.BatchID end as FileBatch
    With count(distinct FileBatch) as  CntFile
    Optional Match(n:Claims {Direction : $RecType}) ,(m:FileIntake {Direction : $RecType}) 
    where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    and ($State = '' or ($State <>'' and m.State= $State )) 
    and ('`+ Object.values(params)[5] +`' = '' or 
        ('`+ Object.values(params)[5] +`' <>'' and
        (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
        toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
        toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
        ))
    and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    Optional Match (j:ValidatorResponse) where m.FileID=j.FileID
    With n.ClaimID as ClaimID, n.FileID as FileID,m.BatchName as BatchName,m.BatchStatus as BatchStatus,m.FileName as filename,
    m.Status as FileStatus,case when j.response_999 IS NULL then '' else '999' end as F999,m.F277 as F277,CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
    CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
    CASE WHEN n.Transaction_Status IN ['SentToQNXT'] THEN 1 ELSE 0 END as SentToQNXT,              
    CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress,
    CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
    CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
    CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
    CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as ReadytoSend, 0 as Valid, 
    0 as Error, 0 as ClaimSent, CntFile as CntFile
    return {FileID : toString(FileID), RecCount: toString(Max(CntFile)), filename: toString(filename),Submitted: toString(Count(ClaimID)) 
      ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),Paid : toString(Paid),
    denied : toString(denied),  WIP : toString(WIP), Pending : toString(Pending),SentToQNXT: toString(SentToQNXT),
    F277: toString(F277),F999  : toString(F999) ,FileStatus : toString(FileStatus),BatchName: toString(BatchName),
    BatchStatus: toString(BatchStatus),Valid: toString(Valid),Error: toString(Error),ReadytoSend : toString(ReadytoSend)
    ,ClaimSent : toString(ClaimSent)} as ClaimsDailyAudit Order by `+ Orderby + `;`

    // let query =`	Optional Match (m:FileIntake {Direction : $RecType})-[r:FileIntake_ST]->(b:ST_SE)-[s:ST_HL20]->(c:HL20)-[t:HL20_HL22]->(d:HL22)-[*..]->(n:Claims {Direction : $RecType})
    // where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    // and ($State = '' or ($State <>'' and m.State= $State )) 
    // and ('`+ Object.values(params)[5] +`' = '' or 
    //     ('`+ Object.values(params)[5] +`' <>'' and
    //      (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
    //     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
    //     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
    //     ))
    // and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    // With case when m.FileID is not null then m.FileID else n.BatchID end as FileBatch
    // With count(distinct FileBatch) as  CntFile
    // Optional Match(n:Claims {Direction : $RecType}) ,(m:FileIntake {Direction : $RecType}) 
    // where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    // and ($State = '' or ($State <>'' and m.State= $State )) 
    // and ('`+ Object.values(params)[5] +`' = '' or 
    //     ('`+ Object.values(params)[5] +`' <>'' and
    //     (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
    //     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
    //     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
    //     ))
    // and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    // Optional Match (j:ValidatorResponse) where m.FileID=j.FileID
    // With n.ClaimID as ClaimID, n.FileID as FileID,m.BatchName as BatchName,m.BatchStatus as BatchStatus,m.FileName as filename,
    // m.Status as FileStatus,case when j.response_999 IS NULL then '' else '999' end as F999,m.F277 as F277,CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
    // CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
    // CASE WHEN n.Transaction_Status IN ['SentToQNXT'] THEN 1 ELSE 0 END as SentToQNXT,              
    // CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress,
    // CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
    // CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
    // CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
    // CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as ReadytoSend, 0 as Valid, 
    // 0 as Error, 0 as ClaimSent, CntFile as CntFile
    // return {FileID : toString(FileID), RecCount: toString(Max(CntFile)), filename: toString(filename),Submitted: toString(Count(ClaimID)) 
    //   ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),Paid : toString(Paid),
    // denied : toString(denied),  WIP : toString(WIP), Pending : toString(Pending),SentToQNXT: toString(SentToQNXT),
    // F277: toString(F277),F999  : toString(F999) ,FileStatus : toString(FileStatus),BatchName: toString(BatchName),
    // BatchStatus: toString(BatchStatus),Valid: toString(Valid),Error: toString(Error),ReadytoSend : toString(ReadytoSend)
    // ,ClaimSent : toString(ClaimSent)} as ClaimsDailyAudit Order by `+ Orderby + ` SKIP ($page - 1) * 10 LIMIT 10;`

    // let query =`Optional Match(m:FileIntake {Direction : $RecType})-[r:HasClaims]->(n:Claims {Direction : $RecType})
    // where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    // and ($State = '' or ($State <>'' and m.State= $State )) 
    // and ('`+ Object.values(params)[5] +`' = '' or 
    //     ('`+ Object.values(params)[5] +`' <>'' and
    //      (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
    //     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
    //     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
    //     ))
    // and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    // With case when m.FileID is not null then m.FileID else n.BatchID end as FileBatch
    // With count(distinct FileBatch) as  CntFile
    // Optional Match(n:Claims {Direction : $RecType}) ,(m:FileIntake {Direction : $RecType}) 
    // where n.FileID=m.FileID and  ($submitter = '' or ($submitter <>'' and Replace(m.ISA06,' ','')= Replace($submitter,' ','') )) 
    // and ($State = '' or ($State <>'' and m.State= $State )) 
    // and ('`+ Object.values(params)[5] +`' = '' or 
    //     ('`+ Object.values(params)[5] +`' <>'' and
    //     (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[5] +`.*') or 
    //     toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[5] +`.*')   or 
    //     toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[5] +`.*'))
    //     ))
    // and ($fromDt = '' or ($fromDt <>'' and Date($fromDt) <= date(n.NewClaimDate) <= Date($ToDt)))              
    // Optional Match (j:ValidatorResponse) where m.FileID=j.FileID
    // With n.ClaimID as ClaimID, n.FileID as FileID,m.BatchName as BatchName,m.BatchStatus as BatchStatus,m.FileName as filename,
    // m.Status as FileStatus,case when j.response_999 IS NULL then '' else '999' end as F999,m.F277 as F277,CASE WHEN n.ClaimStatus = 'Accepted' THEN  1 ELSE 0 END as Accepted ,
    // CASE WHEN n.ClaimStatus IN ['Rejected','Duplicate','FullFileReject'] THEN  1 ELSE 0 END as Rejected ,
    // CASE WHEN n.Transaction_Status IN ['SentToQNXT'] THEN 1 ELSE 0 END as SentToQNXT,              
    // CASE WHEN n.ClaimStatus='Validating' THEN  1 ELSE 0 END as InProgress,
    // CASE WHEN n.adjudication_status='Paid' THEN  1 ELSE 0 END  as  Paid,
    // CASE WHEN n.adjudication_status='denied' THEN  1 ELSE 0 END  as denied , 
    // CASE WHEN n.adjudication_status='WIP' THEN  1 ELSE 0 END as  WIP,
    // CASE WHEN n.adjudication_status='Pending' THEN  1 ELSE 0 END as Pending,0 as ReadytoSend, 0 as Valid, 
    // 0 as Error, 0 as ClaimSent, CntFile as CntFile
    // return {FileID : toString(FileID), RecCount: toString(Max(CntFile)), filename: toString(filename),Submitted: toString(Count(ClaimID)) 
    //   ,Accepted : toString(sum(Accepted)) ,Rejected : toString(sum(Rejected)),Paid : toString(Paid),
    // denied : toString(denied),  WIP : toString(WIP), Pending : toString(Pending),SentToQNXT: toString(SentToQNXT),
    // F277: toString(F277),F999  : toString(F999) ,FileStatus : toString(FileStatus),BatchName: toString(BatchName),
    // BatchStatus: toString(BatchStatus),Valid: toString(Valid),Error: toString(Error),ReadytoSend : toString(ReadytoSend)
    // ,ClaimSent : toString(ClaimSent)} as ClaimsDailyAudit Order by `+ Orderby + ` SKIP ($page - 1) * 10 LIMIT 10;`
                      
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('ClaimsDailyAudit')})
      })
  },
  ProviderList(_, params) {
    let session = driver.session();
    let query ="";

    if (Object.values(params)[0] =="Claim837RT"){
      query =`MATCH (n:Claims {Direction : $RecType}) 
            where n.BillingProviderLastName is not null and ('`+ Object.values(params)[2] +`' = '' or 
            ('`+ Object.values(params)[2] +`' <>'' and (toLower(n.BillingProviderLastName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or 
            toLower(n.BillingProviderFirstName) =~ toLower('.*`+ Object.values(params)[2] +`.*') or
            toLower(n.BillingProviderFirstName + ' ' + n.BillingProviderLastName ) =~ toLower('.*`+ Object.values(params)[2] +`.*')))) 
            with distinct n.BillingProviderFirstName + ' '+ n.BillingProviderLastName as Provider order by Provider LIMIT 20 return {Provider : Provider} as ProviderList  ;`;
    }
    // console.log(query);
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('ProviderList')})
      })
  },
  RemittanceViewerFileDetails(_, params) {
    let session = driver.session();      
    if (Object.values(params)[7] =="")
    {
      Object.values(params)[7]="Order By RemittanceViewerFileDetails.FileDate"
    }    
    let query = `MATCH (x:ClaimERAIntakeFileHeader)
    where ($Sender = '' or ($Sender <>'' and x.ISA06= $Sender ))  
    and ($State = '' or ($State <>'' and x.ExtraField9= $State ))          
    and ('`+ Object.values(params)[2] + `' = '' or 
    ('`+ Object.values(params)[2] + `' <>'' and
     (toLower(x.Payee_N102) =~ toLower('.*`+ Object.values(params)[2] + `.*'))))
    and ($EFTStartDt = '' or ($EFTStartDt <>'' and Date($EFTStartDt) <= 
    date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
     month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
     Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EFTEndDt))) 
     Optional Match  (y:ClaimERAIntakeClaimPMT) where x.FileID=y.FileID     
      and ($ClaimReceivedStartDt = '' or ($ClaimReceivedStartDt <>'' and Date($ClaimReceivedStartDt) <= 
      date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($ClaimReceivedEndDt)))
    With distinct x.FileID as FileID
      With count(distinct FileID) as RecCount

      MATCH (n:ClaimERAIntakeFileHeader) where 
      ($Sender = '' or ($Sender <>'' and n.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and n.ExtraField9= $State ))          
     and ('`+ Object.values(params)[2] + `' = '' or 
     ('`+ Object.values(params)[2] + `' <>'' and
      (toLower(n.Payee_N102) =~ toLower('.*`+ Object.values(params)[2] + `.*'))))
     and ($EFTStartDt = '' or ($EFTStartDt <>'' and Date($EFTStartDt) <= 
     date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EFTEndDt))) 
     Optional Match  (m:ClaimERAIntakeClaimPMT) where n.FileID=m.FileID     
      and ($ClaimReceivedStartDt = '' or ($ClaimReceivedStartDt <>'' and Date($ClaimReceivedStartDt) <= 
      date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyyMMdd HHmmss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($ClaimReceivedEndDt)))             
    
      With distinct RecCount as RecCount,n.ISA06 as Sender ,n.Payee_N102 as Organization,n.FileID as FileID ,n.FileName as FileName 
    ,n.FileDate as FileDate,n.TRN01 as TRN01,n.TRN02 as CheckEFTNo,n.TRN03 as TRN03 ,n.PayerName as PayerName
    ,n.PayerID as PayerID,n.BPR16 as CheckEFTDt,n.BPR15 as AccountNo ,n.BPR04 as CHECKEFTFlag    
    ,n.ISA08 as Receiver
    return { RecCount: toString(RecCount),Sender : toString(Sender),Organization:toString(Organization),
      FileID:toString(FileID),FileName : toString(FileName),CheckEFTNo: toString(CheckEFTNo)
    ,FileDate : toString(FileDate), PayerName: toString(PayerName) ,PayerID : toString (PayerID),AccountNo : toString(AccountNo) ,CHECKEFTFlag : toString(CHECKEFTFlag)
    , CheckEFTDt : toString(CheckEFTDt) ,Receiver:toString(Receiver) } as RemittanceViewerFileDetails
     `+ Object.values(params)[7] + ` SKIP ($page - 1) * 10 LIMIT 10 ;`
     console.log(query);  
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('RemittanceViewerFileDetails')})
      })
  }, 
  RemittanceViewerPatientDetails(_, params) {
    let session = driver.session();      
    if (Object.values(params)[7] =="")
    {
      Object.values(params)[7]="Order By RemittanceViewerPatientDetails.ClaimReceivedDate"
    }    
    let query = `MATCH (x:ClaimERAIntakeFileHeader)
    , (y:ClaimERAIntakeClaimPMT) where x.FileID=y.FileID
  
    and ($FileID = '' or ($FileID <>'' and y.FileID =$FileID)) 
     and ($Sender = '' or ($Sender <>'' and x.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and x.ExtraField9= $State ))          
     and ('`+ Object.values(params)[2] + `' = '' or 
     ('`+ Object.values(params)[2] + `' <>'' and
      (toLower(x.Payee_N102) =~ toLower('.*`+ Object.values(params)[2] + `.*'))))
     and ($EFTStartDt = '' or ($EFTStartDt <>'' and Date($EFTStartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,Day:apoc.date.fields (apoc.date.format(apoc.date.parse(x.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EFTEndDt))) 
      and ($ClaimReceivedStartDt = '' or ($ClaimReceivedStartDt <>'' and Date($ClaimReceivedStartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years,month: apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,Day:apoc.date.fields (apoc.date.format(apoc.date.parse(y.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($ClaimReceivedEndDt)))
    With distinct Id(y) as RefID
      With count(distinct RefID) as RecCount
      MATCH (n:ClaimERAIntakeFileHeader), (m:ClaimERAIntakeClaimPMT) where n.FileID=m.FileID
      and ($FileID = '' or ($FileID <>'' and m.FileID =$FileID)) 
     and ($Sender = '' or ($Sender <>'' and n.ISA06= $Sender ))  
     and ($State = '' or ($State <>'' and n.ExtraField9= $State ))          
     and ('`+ Object.values(params)[2] + `' = '' or 
     ('`+ Object.values(params)[2] + `' <>'' and
      (toLower(n.Payee_N102) =~ toLower('.*`+ Object.values(params)[2] + `.*'))))
     and ($EFTStartDt = '' or ($EFTStartDt <>'' and Date($EFTStartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(n.BPR16, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EFTEndDt))) 
      and ($ClaimReceivedStartDt = '' or ($ClaimReceivedStartDt <>'' and Date($ClaimReceivedStartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months, 
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(m.ClaimReceivedDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($ClaimReceivedEndDt)))             
    
      With distinct RecCount as RecCount,Id(m) as RefId,n.FileID as FileID ,n.FileName as FileName 
    ,n.FileDate as FileDate,m.CLP07 as ClaimID,case when m.ClaimReceivedDate IS NULL then '' else m.ClaimReceivedDate end as ClaimReceivedDate,m.Patient_N103 + '' + m.Patient_N104 as PatientName,
    m.CLP01 as PatientControlNo,n.Payer_N102    as PayerName
    ,m.CLP03 as TotalChargeAmt , m.CLP04 as TotalClaimPaymentAmt 
    
    return { RecCount: toString(RecCount),RefId : toString(RefId),FileID:toString(FileID),FileName : toString(FileName),ClaimID: toString(ClaimID)
    ,FileDate : toString(FileDate), ClaimReceivedDate: toString(ClaimReceivedDate) ,PatientName : toString (PatientName),
    PatientControlNo : toString(PatientControlNo) ,PayerName : toString(PayerName),TotalChargeAmt : toString(TotalChargeAmt),
    TotalClaimPaymentAmt : toString(TotalClaimPaymentAmt)
    } as RemittanceViewerPatientDetails
     `+ Object.values(params)[7] + ` SKIP ($page - 1) * 10 LIMIT 10 ;`
     console.log(query);  
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('RemittanceViewerPatientDetails')})
      })
  },
  RemittanceViewerClaimDetails(_, params) {
    let session = driver.session();      
    
    let query = `MATCH (n:ClaimERAIntakeFileHeader) ,(m:ClaimERAIntakeClaimPMT) where n.FileID=m.FileID 
    and m.FileID= $FileID  and m.CLP07=$ClaimID 
      With n.FileID as FileID,n.FileName as FileName,n.FileDate as FileDate, n.Payee_N102 as Organization ,n.Payee_N103 as Payee_IdentificationQL,
      n.Payee_N104 as Payee_IdentificationCode,n.TRN02 as CheckEFTNo,n.TRN03 as PayerIdentifier,n.PayerName as PayerName 
      ,n.PayerID as PayerID,n.BPR16 as CheckEFTDt,
      n.BPR15 as AccountNo ,n.BPR04 as CHECKEFTFlag  ,m.CLP07 as ClaimID,m.CLP07 as PayerClaimControl,m.ClaimReceivedDate as ClaimReceivedDate,
      m.Patient_N103 + '' + m.Patient_N104 as PatientName,
      m.CLP01 as PatientControlNo
      ,m.CLP03 as TotalChargeAmt , m.CLP04 as TotalClaimPaymentAmt,m.CLP05 as PatietResAMT ,m.CLP11  as DigonisCode,
       m.CLP12 as DGNQty,m.CLP02 As ClaimStatusCode,m.CLP08 as FacilityCode,m.CAS03 as AdjustmentAmt
    return { FileID: toString(FileID),FileName:toString(FileName),FileDate : toString(FileDate),Organization: toString(Organization)
    ,Payee_IdentificationQL : toString(Payee_IdentificationQL), Payee_IdentificationCode: toString(Payee_IdentificationCode) 
    ,CheckEFTNo : toString (CheckEFTNo),
    PayerIdentifier : toString(PayerIdentifier) ,PayerName : toString(PayerName),PayerID : toString(PayerID),
    CheckEFTDt : toString(CheckEFTDt),
    AccountNo : toString(AccountNo),
    CHECKEFTFlag : toString(CHECKEFTFlag) 
    ,ClaimID : toString(ClaimID),
    PayerClaimControl: toString(PayerClaimControl),
    ClaimReceivedDate: toString(ClaimReceivedDate),
     PatientName: toString(PatientName),
    PatientControlNo: toString(PatientControlNo)
    , TotalChargeAmt : toString(TotalChargeAmt),
      TotalClaimPaymentAmt : toString(TotalClaimPaymentAmt),
      PatietResAMT: toString(PatietResAMT) 
      , DigonisCode : toString(DigonisCode),
     DGNQty : toString(DGNQty), ClaimStatusCode : toString(ClaimStatusCode), FacilityCode : toString(FacilityCode),AdjustmentAmt : toString(AdjustmentAmt)

    } as RemittanceViewerClaimDetails`
    
     console.log(query);  
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('RemittanceViewerClaimDetails')})
      })
  }, 
  RemittanceViewerClaimServiceDetails(_, params) {
    let session = driver.session();      
   
    let query = `OPTIONAL MATCH   (x:ClaimERAIntakeClaimPMT),(y:ClaimERAIntakeClaimSVC)  
    where x.FileID=y.FileID and x.CLP07=y.ClaimID and y.FileID= $FileID  and y.ClaimID=$ClaimID 
    With distinct x.FileID as FileID,x.CLP07 as ClaimID,count(y.ClaimID) as RecCount
    MATCH (n:ClaimERAIntakeClaimSVC)  
    where n.FileID= $FileID  and n.ClaimID=$ClaimID 
      With  RecCount as RecCount,n.FileID as FileID,n.ClaimID as ClaimID,
      case when n.ServiceEndDate IS NULL then '' else  n.ServiceEndDate end as ServiceEndDate,
      case when n.ServiceStartDate IS NULL then '' else n.ServiceStartDate  end as ServiceStartDate,n.SVC01 as AdjudicatedCPT ,n.SVC02 as  ChargeAmount,
      n.SVC03 as PaidAmt,n.CAS03 as AdjAmt,n.SVC06 as SubmittedCPT,n.LineControlNo as LineControlNo,n.AMT02 as ServiceSupplementalAmount,
      n.SVC07 as OriginalUnitsofServiceCount,n.SVC05 as UnitsofServicePaidCount
    return { RecCount : toString(RecCount) ,FileID: toString(FileID),ClaimID:toString(ClaimID),
      ServiceEndDate : toString(ServiceEndDate),ServiceStartDate: toString(ServiceStartDate)
    ,AdjudicatedCPT : toString(AdjudicatedCPT), ChargeAmount: toString(ChargeAmount) 
    ,PaidAmt : toString (PaidAmt),
    AdjAmt : toString(AdjAmt) ,SubmittedCPT : toString(SubmittedCPT),LineControlNo : toString(LineControlNo),
    ServiceSupplementalAmount : toString(ServiceSupplementalAmount),
    OriginalUnitsofServiceCount : toString(OriginalUnitsofServiceCount),
    UnitsofServicePaidCount : toString(UnitsofServicePaidCount) 
     } as RemittanceViewerClaimServiceDetails Order By RemittanceViewerClaimServiceDetails.ServiceStartDate SKIP ($page - 1) * 10 LIMIT 10 `
     
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('RemittanceViewerClaimServiceDetails')})
      })
  },
  Data999(_, params) {
    let session = driver.session();      
    let query ="";
    if (Object.values(params)[1]=="837")
    {
      if (Object.values(params)[8] =="")
      {
        Object.values(params)[8]=" Order By Data999.Date"
      }   
      
      query =`
      Optional MATCH (m:FileIntake {Direction : $RecType}) ,(n:ValidatorResponse) where m.FileID=n.FileID 
      and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(m.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
      month: apoc.date.fields (apoc.date.format(apoc.date.parse(m.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
      Day:apoc.date.fields (apoc.date.format(apoc.date.parse(m.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))
      and ($FileId = '' or ($FileId <>'' and m.FileID =$FileId)) 
      and ($State = '' or ($State <>'' and m.State =$State)) 
      with distinct count(n.FileID) as RecCount

      Optional MATCH (y:FileIntake {Direction : $RecType}) ,(x:ValidatorResponse) where y.FileID=x.FileID       
      and ($StartDt = '' or ($StartDt <>'' and Date($StartDt) <= date({year: apoc.date.fields (apoc.date.format(apoc.date.parse(y.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).years, 
              month: apoc.date.fields (apoc.date.format(apoc.date.parse(y.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).months,  
              Day:apoc.date.fields (apoc.date.format(apoc.date.parse(y.FileDate, 'ms', "yyyy-MM-dd'T'HH:mm:ss"), 'ms', 'yyyy-MM-dd HH:mm:ss')).days }) <= Date($EndDt)))
      and ($FileId = '' or ($FileId <>'' and y.FileID =$FileId)) 
      and ($State = '' or ($State <>'' and y.State =$State)) 

      With RecCount as RecCount,y.FileID as FileId,y.FileName as FileName,y.FileDate as FileDate,x.status as status,x.response_999 as Response,y.ISA06 as Submitter,Id(x) as id
      ,"837" as TrasactionType
       return { RecCount:toString(RecCount), FileId : toString(FileId) ,FileName : toString(FileName), Date: toString(FileDate),Submitter : toString(Submitter),id: toString(id),
        TrasactionType:toString(TrasactionType),status:toString(status),Response : toString(Response)} as Data999    
        `+ Object.values(params)[8] + ` SKIP ($page - 1) * 10 LIMIT 10 ;`      
        console.log(query);          
    }    
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('Data999')})
      })
  },  
  ClaimStagesInbound(_, params) {
    let session = driver.session();      
    let query =`MATCH (m:FileIntake {FileID: $FileID}),(n:Claims {FileID:$FileID , ClaimID:$ClaimID}) 
    where n.FileID=m.FileID
    With COLLECT({Stage:'Claim Status -'+ coalesce(n.ClaimStatus,''), Createdatetime : n.CreateDateTime}) as StageInbound, n as n    
    With StageInbound + COLLECT({Stage :'HiPaaS Status -'+ coalesce(n.Transaction_Status,''), Createdatetime : n.CreateDateTime}) as StageInbound, n as n  
    With StageInbound + COLLECT({Stage :'999 Response -'+ coalesce(n.F999,''), Createdatetime : n.CreateDateTime}) as StageInbound , n as n 
    With StageInbound + COLLECT({Stage :'277CA Response -'+ coalesce(n.F277,''), Createdatetime : n.CreateDateTime}) as StageInbound , n as n 
    With StageInbound + COLLECT({Stage :'Adjudication Status -'+ coalesce(n.adjudication_status,''), Createdatetime : n.CreateDateTime}) as StageInbound
    unwind StageInbound as ClaimStagesInbound 
    return ClaimStagesInbound;`;
    //  console.log(query);  
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('ClaimStagesInbound')})
      })
  },
  Claim837RTRejectedFile(_, params) {
    let session = driver.session();        
    let query =`MATCH(m:FileIntake {Direction :  $RecType})
    where
            m.Status IN ['Error','Rejected']  and              
            ($Sender = '' or ($Sender <>'' and Replace(m.ISA06,' ','')= Replace($Sender,' ','') ))  
            and ($State = '' or ($State <>'' and m.State= $State ))           
            and ($Type = '' or ($Type ='P' and m.GS08 =~ '.*005010X222A.*') or ($Type ='I' and m.GS08 =~ '.*005010X223A.*'))
           
            return {TotalRejectedFiles : toString(count(distinct m.FileID))} as Claim837RTRejectedFile`
           console.log(query);
    return session.run(query, params)
      .then(result => {
        return result.records.map(record => {return record.get('Claim837RTRejectedFile')})
      })
  }, 
  },
  Mutation:{
    updateuser(_, params) {
      let session = driver.session();      
      // let query = "MERGE (n:User { Name: $Name, Role: $Role }) RETURN n;";
      let query ="";
      
      

      if(Object.values(params)[0] ==0)
        {
          let encoded = base64encode(Object.values(params)[6]); 
          query =`Match (m:User_Role) where id(m)=`+ Object.values(params)[1] +`  
                  Merge (n:User { FirstName: $FirstName, LastName: $LastName, role_id: `+ Object.values(params)[1] +`, Email: $Email, PhoneNumber: $PhoneNumber, 
                  PasswordHash:'`+ encoded +`', is_Active:`+ Object.values(params)[7] +`  })
                  ON CREATE SET n.isCreated = "true" ,n.isFound = "false"
                  ON MATCH SET n.isFound = "true",n.isCreated = "false"
                  Merge (n)-[r:HasRole]->(m)
                  RETURN case when n.isCreated = "true" then 'User Created Successfully.' else 'Email already exists with another user.'end as Msg;`
        
        }
        else if(Object.values(params)[0] > 0)
        {
         
          // query = `MATCH (n1:User)-[r1:HasRole]->(n2:User_Role),(n6:User_Role)
          //     WHERE id(n1) = `+ Object.values(params)[0] +` AND id(n2) <> `+ Object.values(params)[1] +` and id(n6) = `+ Object.values(params)[1] +`
          //     Merge (n1)-[r2:HasRole]->(n6)
          //     SET r2=r1, n1.FirstName= $FirstName, n1.LastName= $LastName, n1.role_id= `+ Object.values(params)[1] +`, n1.Email= $Email, n1.PhoneNumber= $PhoneNumber,
          //     n1.PasswordHash=$PasswordHash, n1.is_Active=`+ Object.values(params)[7] +`
          //     DELETE r1 
          //     RETURN {Id : tostring(id(n1)),role_id: tostring(n1.role_id),  FirstName :n1.FirstName , LastName : n1.LastName, Email:n1.Email,PhoneNumber: n1.PhoneNumber,
          //     PasswordHash:n1.PasswordHash, is_Active:tostring(n1.is_Active)} as n;`;
                  
          // query = `MATCH (n1:User)-[r1:HasRole]->(n2:User_Role),(n6:User_Role)
          //     WHERE id(n1) = `+ Object.values(params)[0] +` AND id(n2) <> `+ Object.values(params)[1] +` and id(n6) = `+ Object.values(params)[1] +`
          //     Merge (n1)-[r2:HasRole]->(n6)
          //     SET r2=r1, n1.FirstName= $FirstName, n1.LastName= $LastName, n1.role_id= `+ Object.values(params)[1] +`, n1.Email= $Email, n1.PhoneNumber= $PhoneNumber,
          //     n1.PasswordHash=$PasswordHash, n1.is_Active=`+ Object.values(params)[7] +`
          //     DELETE r1 
          //     RETURN 'User Updated Successfully.' as Msg;`;
          
          // query = `MATCH (n1:User)
          //     WHERE id(n1) = `+ Object.values(params)[0] +` 
          //     SET n1.FirstName= $FirstName, n1.LastName= $LastName, n1.PhoneNumber= $PhoneNumber,
          //     n1.PasswordHash='`+ encoded +`', n1.is_Active=`+ Object.values(params)[7] +`              
          //     RETURN 'User Updated Successfully.' as Msg;`;    
          
          query = `MATCH (n1:User {Email: $Email}),(n6:User_Role) 
              WHERE id(n1) = `+ Object.values(params)[0] +` and id(n6) = `+ Object.values(params)[1] +`
              Optional match (n1)-[r1:HasRole]->(n2:User_Role)
              WHERE id(n1) = `+ Object.values(params)[0] +` AND id(n2) <> `+ Object.values(params)[1] +` and id(n6) = `+ Object.values(params)[1] +` 
              Merge (n1)-[r2:HasRole]->(n6)
              SET n1.FirstName= $FirstName, n1.LastName= $LastName, n1.role_id= `+ Object.values(params)[1] +`, n1.PhoneNumber= $PhoneNumber, n1.is_Active=`+ Object.values(params)[7] +` 
              DELETE r1              
              RETURN 'User Updated Successfully.' as Msg;`;   
        }
        // console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        }).catch(err =>{          
          throw new Error((err.code == "Neo.ClientError.Schema.ConstraintValidationFailed") ? "Email already exists with another user." : "Contact to admin for Error.");
        })
    },
    InactiveUser(_, params) {
      let session = driver.session();           
      let query =""   
            
      query = `Match (n1:User {Email: $Email}) WHERE id(n1) = `+ Object.values(params)[0] +`
        set n1.is_Active=`+ Object.values(params)[2] +`
        RETURN case when n1.is_Active=1 then 'User Activated Successfully.' else 'User Deactivated Successfully.' end as Msg;`;
                
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateuserrole(_, params) {
      let session = driver.session();           
      let query =""
      if(Object.values(params)[0] ==0)
        
          {
            query = `Merge (n:User_Role {role_description: $role_description, is_active:`+ Object.values(params)[2] +` }) 
            RETURN {Role_id : tostring(id(n)), role_description :n.role_description , is_active : tostring(n.is_active)} as n;`;
          }
        else
        {
          query = `Match (n:User_Role ) where id(n)=`+ Object.values(params)[0] +` 
            set n = { role_description: $role_description}
            RETURN {Role_id : tostring(id(n)), role_description :n.role_description, is_active:tostring(n.is_active)} as n;`;
        }        
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('n')})
        })
    },
    updateuserwisemenu(_, params) {
      let session = driver.session();      
      // let query = "MERGE (n:User { Name: $Name, Role: $Role }) RETURN n;";
      let query ="";
      let menulist=""; 
      let menuforinactive="";     
      let menuforactive="";    
      let menuforeditor="";     
      let menuforuneditor="";     
      
     
      //role ,uncheck , check, unchkeditor, chkeditor
      // menulist =  Object.values(params)[1]  +','+  Object.values(params)[2]  +','+ Object.values(params)[3] +','+ Object.values(params)[4];
      
      for(var i=1; i <= 4; i++)
      {
        // console.log( Object.values(params)[i]);
        menulist= menulist + (menulist != '' && Object.values(params)[i] != '' ? ',': '') + (Object.values(params)[i] =='' ? '' : Object.values(params)[i]) ;
        
      }   
      // console.log(menulist);
      // query =`Match (n:User_Role),(m:Menu_Master) 
      // where id(n)=`+ Object.values(params)[0] +` and m.menu_id in [`+ menulist +`]
      // merge (n)-[r:HasAssigned]->(m)
      // ON CREATE SET  r.is_active = case when m.menu_id in [`+ menuforinactive +`] then 0 else 1 end
      // ,r.is_editor =case when m.menu_id in [`+ menuforuneditor +`] then 0 else 1 end
      // ON MATCH SET r.is_active = case when m.menu_id in [`+ menuforactive +`] then 1 else 0 end  
      // ,r.is_editor =case when m.menu_id in [`+ menuforeditor +`] then 1 else 0 end 
      // return distinct 'User Menu updated successfully.' as Msg ;`      
      
      query =`Match (n:User_Role),(m:Menu_Master) 
      where id(n)=`+ Object.values(params)[0] +` and m.menu_id in [`+ menulist +`]
      merge (n)-[r:HasAssigned]->(m)
      ON CREATE SET  r.is_active = case when m.menu_id in [`+ Object.values(params)[1] +`] then 0 
                                        when m.menu_id in [`+ Object.values(params)[2] +`] then 1 
                                        else 0 end

      ,r.is_editor =case when m.menu_id in [`+ Object.values(params)[3] +`] then 0 
                         when m.menu_id in [`+ Object.values(params)[4] +`] then 1 
                         else 1 end

      ON MATCH SET r.is_active = case when m.menu_id in [`+ Object.values(params)[1] +`] then 0 
                                      when m.menu_id in [`+ Object.values(params)[2] +`] then 1 
                                      else 0 end

      ,r.is_editor =case when m.menu_id in [`+ Object.values(params)[3] +`] then 0 
                         when m.menu_id in [`+ Object.values(params)[4] +`] then 1 
                         else 1 end 
      return distinct 'User Menu updated successfully.' as Msg ;`
     //return id(n) as role_id, r, m.menu_id, 'User Menu updated successfully.' as Msg order by m.menu_id;`    
      console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {
            console.log(record.get('Msg'));
            return record.get('Msg')})
        })
    },
    ChangePassword(_, params) {
      let session = driver.session();      
      let query ="";
       
      let Oldencoded = base64encode(Object.values(params)[1]); 
      let Newencoded = base64encode(Object.values(params)[2]);
      
      if(Object.values(params)[3] != 1)
        {//forgot password
          query =`Match (n:User) where id(n)=`+ Object.values(params)[0] +`  
          SET (CASE WHEN n.PasswordHash= '`+ Oldencoded +`' THEN n END).PasswordHash ='`+ Newencoded +`'  
          RETURN case when n.PasswordHash <> '`+ Newencoded +`' then 'You have entered wrong old password.' 
          else 'Password Changed Successfully.' end as Msg;`    
        }
        else 
        {//Change password
          query =`Match (n:User) where id(n)=`+ Object.values(params)[0] +`  
          SET n.PasswordHash ='`+ Newencoded +`' 
          RETURN case when n.PasswordHash <> '`+ Newencoded +`' then 'Password not set.' 
          else 'Password Changed Successfully.' end as Msg;`
        }
      console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {
            console.log(record.get('Msg'));
            return record.get('Msg')})
        })
    },
    MenuMasterUpdate(_, params) {
      let session = driver.session();      
      let query ="";
      let menulist=""; 
      
      for(var i=0 ; i <= 1; i++)
      {
        menulist= menulist + (menulist != '' && Object.values(params)[i] != '' ? ',': '') + (Object.values(params)[i] =='' ? '' : Object.values(params)[i]) ;
      }   
      
      query =`Match (m:Menu_Master) where m.menu_id in [`+ menulist +`]      
      SET m.is_active = case when m.menu_id in [`+ Object.values(params)[0] +`] then 0 
                             when m.menu_id in [`+ Object.values(params)[1] +`] then 1 
                             else 0 end

      ,m.is_editable =case when m.menu_id in [`+ Object.values(params)[2] +`] then 0 
                         when m.menu_id in [`+ Object.values(params)[3] +`] then 1 
                         else 1 end 
      return distinct 'Menu master updated successfully.' as Msg ;`
      console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {
            console.log(record.get('Msg'));
            return record.get('Msg')})
        })
    },
    SP_Trading_Partner_Save(_, params) {
      let session = driver.session();           
      let query =""
      if(Object.values(params)[0] ==0)
        
          {
            query = `Optional Match (m: Trading_Partner) With case when m.ID is null then 1 else  Max(m.ID) + 1  end  as NextCount
            Merge (n:Trading_Partner {ID :NextCount, Trading_Partner_Name: $Trading_Partner_Name, Identifier:$Identifier,
            Functional_Ack_Options: $Functional_Ack_Options, 
            Doc_Envelope_Option:$Doc_Envelope_Option,
            Element_Delimiter: $Element_Delimiter , 
            Segment_Termination_Character : $Segment_Termination_Character,
            Filter_Functional_Acknowledgments :$Filter_Functional_Acknowledgments,
            Reject_Duplicate_ISA:$Reject_Duplicate_ISA ,
            Validate_Outbound_Interchanges:$Validate_Outbound_Interchanges,
            Outbound_Validation_Option : $Outbound_Validation_Option ,
            Authorization_Info_Qualifier :$Authorization_Info_Qualifier,
            Authorization_Info_ID : $Authorization_Info_ID,
            Security_Information_Qualifier : $Security_Information_Qualifier,
            Security_Information_Id :$Security_Information_Id,
            Interchange_ID_Qualifier :$Interchange_ID_Qualifier,
            Interchange_ID :$Interchange_ID,
            Interchange_Standard_ID :$Interchange_Standard_ID,
            Interchange_Version :$Interchange_Version,
            ISA14:$ISA14,
            Test_Indicator :$Test_Indicator,
            Component_Separator :$Component_Separator,
            X12 :$X12,
            Application_Code :$Application_Code,
            Responsible_Agency_Code :$Responsible_Agency_Code,
            GSVersion :$GSVersion,
            Communication_Type :$Communication_Type,
            Use_Default_Settings:$Use_Default_Settings,
            Host :$Host,
            Port :$Port,
            UserName :$UserName,
            Password :$Password,
            Directory :$Directory,
            Create_Directory:$Create_Directory,
            File_Naming_Options :$File_Naming_Options,
            Direction : $RecType
           }) 
            ON CREATE SET n.isCreated = "true" ,n.isFound = "false"
            ON MATCH SET n.isFound = "true",n.isCreated = "false"
            RETURN case when n.isCreated = "true" then 'Trading Partner saved successfully.' else 'Trading Partner already exists.'end as Msg;`;
          }
        else
        {
          query = `Match (n:Trading_Partner ) where n.ID=`+ Object.values(params)[0] +` 
            set n.Trading_Partner_Name = $Trading_Partner_Name, n.Identifier = $Identifier, 
                n.Functional_Ack_Options=$Functional_Ack_Options,
                n.Doc_Envelope_Option= $Doc_Envelope_Option, 
                n.Element_Delimiter=$Element_Delimiter,
                n.Segment_Termination_Character =$Segment_Termination_Character,
                n.Filter_Functional_Acknowledgments =$Filter_Functional_Acknowledgments,
                n.Reject_Duplicate_ISA =$Reject_Duplicate_ISA ,
                n.Validate_Outbound_Interchanges =$Validate_Outbound_Interchanges,
                n.Outbound_Validation_Option = $Outbound_Validation_Option ,
                n.Authorization_Info_Qualifier =$Authorization_Info_Qualifier,
                n.Authorization_Info_ID = $Authorization_Info_ID,
                n.Security_Information_Qualifier = $Security_Information_Qualifier,
                n.Security_Information_Id =$Security_Information_Id,
                n.Interchange_ID_Qualifier =$Interchange_ID_Qualifier,
                n.Interchange_ID =$Interchange_ID,
                n.Interchange_Standard_ID =$Interchange_Standard_ID,
                n.Interchange_Version =$Interchange_Version,
                n.ISA14=$ISA14,
                n.Test_Indicator =$Test_Indicator,
                n.Component_Separator =$Component_Separator,
                n.X12 =$X12,
                n.Application_Code =$Application_Code,
                n.Responsible_Agency_Code =$Responsible_Agency_Code,
                n.GSVersion =$GSVersion,
                n.Communication_Type =$Communication_Type,
                n.Use_Default_Settings=$Use_Default_Settings,
                n.Host =$Host,
                n.Port =$Port,
                n.UserName =$UserName,
                n.Password =$Password,
                n.Directory =$Directory,
                n.Create_Directory=$Create_Directory,
                n.File_Naming_Options =$File_Naming_Options
            RETURN 'Trading Partner Updated Successfully.' as Msg;`;
        }        
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateIgnoreCode(_, params) {
      let session = driver.session();      
      let query ="";
      let Rulelist=""; 
      
      for(var i=0 ; i <= 1; i++)
      {
        Rulelist= Rulelist + (Rulelist != '' && Object.values(params)[i] != '' ? ',': '') + (Object.values(params)[i] =='' ? '' : Object.values(params)[i]) ;
      }   
      
      query =`Match (m:Rules) where m.seqid in [`+ Rulelist +`]      
      SET m.Ignore = case when m.seqid in [`+ Object.values(params)[0] +`] then 0 
                             when m.seqid in [`+ Object.values(params)[1] +`] then 1 
                             else 0 end
      return distinct 'Rules updated successfully.' as Msg ;`
      console.log(query);
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {
            console.log(record.get('Msg'));
            return record.get('Msg')})
        })
    },
    SP_Save_TransactionSetup(_, params) {
      let session = driver.session();           
      let query =""
      if(Object.values(params)[0] ==0)        
          {
            query = `Optional Match (m: Transaction_Setup) With case when m.ID is null then 1 else  Max(m.ID) + 1  end  as NextCount
            Merge (n:Transaction_Setup {ID :NextCount, Trading_Partner: $Trading_Partner, Transaction_Type:$Transaction_Type,
            Acceptance_Criteria: $Acceptance_Criteria, Campanion_Guide: $Campanion_Guide}) 
            ON CREATE SET n.isCreated = "true" ,n.isFound = "false"
            ON MATCH SET n.isFound = "true",n.isCreated = "false"
            RETURN case when n.isCreated = "true" then 'Transaction Setup saved successfully.' else 'Transaction Setup already exists.'end as Msg;`;
          }
        else
        {
          query = `Match (n:Transaction_Setup ) where n.ID=`+ Object.values(params)[0] +` 
            set n.Trading_Partner = $Trading_Partner, n.Transaction_Type = $Transaction_Type, 
                n.Acceptance_Criteria=$Acceptance_Criteria,
                n.Campanion_Guide= $Campanion_Guide
            RETURN 'Trading Setup Updated Successfully.' as Msg;`;
        }        
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    TradingPartnerSave(_, params) {
      let session = driver.session();           
      let query =""
      
      query = `Optional Match (m: TradingPartner) With case when m.ID is null then 1 else  Max(m.ID) + 1  end  as NextCount
      Merge (n:TradingPartner {ISA06_ID : $ISA06_ID, State: $State, ISA08_ID: $ISA08_ID, PayerID : $PayerID ,  Transaction_Code : $Transaction_Code}) 
      ON CREATE SET n.isCreated = "true" ,n.isFound = "false" , n.ID=NextCount,
                    n.PayerName = $PayerName, n.ISA06_Name = $ISA06_Name, n.ISA08_Name =$ISA08_Name, n.TradingPartnerName = $TradingPartnerName, n.Is_Active = 1
      ON MATCH SET n.isFound = "true",n.isCreated = "false",  
                   n.isChange = case when n.ISA06_Name = $ISA06_Name and n.PayerName = $PayerName and n.ISA08_Name =$ISA08_Name and n.TradingPartnerName = $TradingPartnerName then "false" else "true" end
                   ,n.PayerName = $PayerName, n.ISA06_Name = $ISA06_Name, n.ISA08_Name =$ISA08_Name, n.TradingPartnerName = $TradingPartnerName
      RETURN {Msg: case when n.isCreated = "true" then 'Trading Partner saved successfully.' 
                        when n.isChange = "true"  then 'Trading Partner Updated successfully.'
                        else 'Trading Partner already exists.'end ,
      ID: ToString(n.ID) } as Message ;`;
              
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Message')})
        })
    },
    InActiveTradingPartner(_, params) {
      let session = driver.session();           
      let query =""
      
      query = `Match (n1:TradingPartner) WHERE n1.ID = `+ Object.values(params)[0] +`
        set n1.Is_Active=`+ Object.values(params)[1] +`
        RETURN case when n1.Is_Active=1 then 'Trading Partner Activated Successfully.' else 'Trading Partner Deactivated Successfully.' end as Msg;`;
       console.log(query);         
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateEncounterICDCode(_, params) {
      let session = driver.session();           
      let query =""
      //Sequence ID is not present into node.
      query = `Match (n1:EncounterClaims {ClaimID : $ClaimID, FileID :$FileID}) 
        set n1.DiagnosisCodes= $ICDCode, n1.ClaimStatus="Resubmit", n1.ClaimLevelErrors=''
        RETURN 'ICD Code is successfully updated.' as Msg;`;
       console.log(query);         
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateICDCode(_, params) {
      let session = driver.session();           
      let query =""
      
      query = `Match (n1:Claims {ClaimID : $ClaimID, FileID :$FileID}) 
        set n1.DiagnosisCodes= $ICDCode, n1.ClaimStatus="Resubmit", n1.ClaimsLevelError=''
        RETURN 'ICD Code is successfully updated.' as Msg;`;
       console.log(query);         
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateEncounterICDCode(_, params) {
      let session = driver.session();           
      let query =""
      //Sequence ID is not present into node.
      query = `Match (n1:EncounterClaims {ClaimID : $ClaimID, FileID :$FileID}) 
        set n1.DiagnosisCodes= $ICDCode, n1.ClaimStatus="Resubmit", n1.ClaimLevelErrors=''
        RETURN 'ICD Code is successfully updated.' as Msg;`;
       console.log(query);         
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
    updateICDCode(_, params) {
      let session = driver.session();           
      let query =""
      
      query = `Match (n1:Claims {ClaimID : $ClaimID, FileID :$FileID}) 
        set n1.DiagnosisCodes= $ICDCode, n1.ClaimStatus="Resubmit", n1.ClaimsLevelError=''
        RETURN 'ICD Code is successfully updated.' as Msg;`;
       console.log(query);         
      return session.run(query, params)
        .then(result => {
          return result.records.map(record => {return record.get('Msg')})
        })
    },
  }  
};

module.exports = resolveFunctions;