var { makeExecutableSchema } = require("graphql-tools");
// we’ll define our resolver functions in the next section

var resolvers = require("./resolvers");

const typeDefs = `
type PagedData1 {
 ncount: String,
 mcount: String
}

type PagedData2 {
  FileName: String,
  FileDate:String,
  ISA06 : String
 }

 type PagedData3 {
  FileName: String,
  FileDate: String,
  ISA06: String,
  mcount: String
 }

 type PagedData4 {
  ncount: String,
  mcount: String,
  ocount: String
 } 

 type Trading_Partner {
      ID :Int,    
      Trading_Partner_Name:String,    
      Identifier:String,
      Functional_Ack_Options :String ,
      Doc_Envelope_Option :String,
      Element_Delimiter :String,
      Segment_Termination_Character :String,
      Filter_Functional_Acknowledgments : Boolean,
      Reject_Duplicate_ISA:Boolean ,
      Validate_Outbound_Interchanges:Boolean,
      Outbound_Validation_Option :String ,
      Authorization_Info_Qualifier :String,
      Authorization_Info_ID :String,
      Security_Information_Qualifier :String,
      Security_Information_Id :String,
      Interchange_ID_Qualifier :String,
      Interchange_ID :String,
      Interchange_Standard_ID :String,
      Interchange_Version :String,
      ISA14:Boolean,
      Test_Indicator :String,
      Component_Separator :String,
      X12 :String,
      Application_Code :String,
      Responsible_Agency_Code :String,
      GSVersion :String,
      Communication_Type :String,
      Use_Default_Settings:Boolean,
      Host :String,
      Port :String,
      UserName :String,
      Password :String,
      Directory :String,
      Create_Directory:Boolean,
      File_Naming_Options :String
  }
 
 type Trading_Partnerlist {
   Trading_Partner_Name: String 
  }

  type TransactionSetup{
        Transaction_Type: String,
        Companion_Guide: String,
        Acceptance_Criteria: String,
        Trading_Partner: String
    }

  type Eligibilty270Request {  
  Message: String,  
 }  

 type Eligibilty271Response {  
  Message: String,  
 }  

 type DashboardBarChartData {  
  X_axis: String,  
  Y_axis: String
 }  

 type Eligibilty_DateWise { 
      RecCount:String,
      HiPaaSUniqueID :String,
      Date : String,
      Trans_type : String,
      Submiter : String,
      Trans_ID : String,
      Error_Type :String,
      Error_Code :String,
      ErrorDescription :String     
  }

  
  
  type Claim837RTProcessingSummary {
    RecCount: String,  
    ClaimID: String,
    ClaimDate:String,
    ClaimTMTrackingID:String,
    Subscriber_ID: String,
    Claim_Amount: String,
    ClaimStatus: String,
    ProviderLastName : String,
    ProviderFirstName : String,
    SubscriberLastName: String,
    SubscriberFirstName : String,
    adjudication_status : String,
    ClaimLevelErrors : String,
    ClaimUniqueID:String,
    FileID:String,
    FileName: String,
    FileCrDate: String,
    FileStatus : String,
    F277:  String,
    F999:  String,
    TotalLine:  String,    
    TotalLinewise835:  String,
    BatchName:  String,
    BatchStatus:  String,        
    Transaction_Status:  String,
    ClaimRefId :String,
    MolinaClaimID :String
  }
  
  type Claim837RTDashboardCount {
    TotalFiles:String,
    TotalClaims: String, 
    Accepted: String,  
    Rejected: String,  
    Accepted_Per: String,  
    Rejected_Per: String,
    Total999: String,
    Total277CA: String,
    TotalSentToQNXT: String,
    InProgress: String,
    Resubmit: String,
    TotalBatch: String,
    ReadytoSend: String,
    Valid: String,
    Error: String,
    ClaimSent: String,
    RejectedFileCount: String
  }


type Claim837RTClaimBarchart{
  From: String,
  MonthNo:String,
  Year:String,
  To: String,
  Amount : String,
  TotalClaims: String,
  X_axis: String,
  Y_axis: String
}

  type Eligibilty271ErrorwiseCount{
    ErrorType: String,    
    RecCount: String,
    Percentage: String
  }

  type ClaimStatus276Request {    
    Message: String   
   }  
  
   type ClaimStatus277Response {    
    Message: String
   }

   type ClaimStatus_DateWise {  
    HiPaaSUniqueID :String,
    Date : String,
    Trans_type : String,
    Submiter : String,
    Trans_ID : String,
    Error_Code :String
    }


  type ClaimStatus276 {      
      AvgResTime: String,
      TotalNumOfReq: String,
      Success: String,
      Error: String
  }

  type Eligibilty270 {   
    AvgResTime: String,
    TotalNumOfReq: String,
    Success: String,
    Error: String,
    Daily_Volume:String,
    LastMonth_Volume:String,
    ThisMonth_Volume:String,
    In_Compliance:String,
    out_of_Compliance:String,
    Error_Per:String,
    In_Compliance_Per :String,
    out_of_Compliance_per:String,
    NoResponse_Per:String,
    RealTime_Per:String,
    Invalid_Trans :String
}

type User{
  Id :String,
  role_id:String,
  FirstName :String,
  LastName : String,
  Email:String,
  PhoneNumber: String,
  PasswordHash:String ,
  is_active:String,
  CreationDatetime:String,
  role_description:String
}
type Userrole{  
    Role_id :String,        
    role_description:String,            
    is_active :String
}
type UserLogin{ 
    Login:String,
    Id:String,
    DbTech:String,
    role_id:String
}

type UserwiseMenu
  {	
    role_id	: String,
    menu_id	: String,
    menu_description: String,		
    sequence_id	: String,
    parent_node : String,
    menuflag	:String,
    usermenuflag :String,
    is_editor :String,
    is_editable :String,
    menutype:String
  }

type EventLogData{
  HiPaaS_UUID: String, 
  EventName: String ,
  EventCreationDateTime: String, 
  Exception: String ,
  ErrorMessage:String,
  Transaction_Compliance : String
}


type ClaimRequest {    
    Message: String   
   }  
  
   type ClaimStatus277 {    
    Message: String
   }
   type ClaimRequest_Datewise {  
    RecCount:String,
    HiPaaSUniqueID :String,
    Date : String,
    Trans_type : String,
    Submiter : String,
    Trans_ID : String,
    Error_Type:String,
    Error_Code :String,
    ErrorDescription :String
    }

  type ClaimRequest276 {      
      AvgResTime: String,
      TotalNumOfReq: String,
      Success: String,
      Error: String,
      Daily_Volume: String,
      LastMonth_Volume: String,
      ThisMonth_Volume: String,
      In_Compliance: String,
      out_of_Compliance: String,
      Error_Per: String,
      In_Compliance_Per : String,
      out_of_Compliance_per: String,
      NoResponse_Per: String,
      RealTime_Per: String,
      Invalid_Trans : String,
      Total_Paid: String
  }
  type ClaimStatuswiseCount{
    ClaimStatus: String,   
    Total: String
  }

type ErrorType_List{
  ErrorType: String  
}
type Claim837RTDetails {  
  ClaimID: String,
  ClaimDate:String,
  ClaimTMTrackingID:String,
  Subscriber_ID: String,
  Claim_Amount: String,
  ClaimStatus: String,
  ProviderLastName : String,
  ProviderFirstName : String,
  SubscriberLastName: String,
  SubscriberFirstName : String,
  adjudication_status : String,
  ClaimLevelErrors : String,
  AdmissionDate: String,
  BillingProviderAddress : String,
  BillingProviderCity_State_Zip : String,
  ICDCode : String,
  AccidentDate : String,
  FileID : String,
  FieldToUpdate: String,
  ,Transaction_Status : String, 
  F277: String,
  F999 : String,
  ClaimRefId :String,
  MolinaClaimID :String
}

type Claim837RTLineDetails {    
  ClaimID: String,
  ServiceLineCount: String,
  ProviderPaidAmount: String,
  ServiceDate: String,
  ProcedureDate: String,
  PaidServiceUnitCount: String,
  RecCount: String  ,
  MolinaClaimID : String
}

type Claim837RTFileDetails {
  RecCount: String,  
  FileID: String,
  FileName:String,
  Sender:String,
  FileDate: String,
  FileStatus : String,
  Claimcount:String,
  Receiver : String,
  Rejected: String,
  Type: String
}

type Claim835Count {
  Claims837: String,  
  Claims835: String,
  PendingClaims835:String
}

type Claim835StatusCount {
  X_axis: String,
  Y_axis: String
}

type loopid
{
    loopid: String
}

type segment{
    segment: String
}

type element {
    element: String
}

type Rules{
    seqid: String,       
    loopid: String,
    segment: String,	
    element: String,	      
    opert: String,	
    value: String,	
    flag: String,
    severity: String,	
    condition: String,	
    Ignore: String 
}

type Validate{
  Flag: Boolean
} 

type Message{
  Msg: String,
  ID: String
} 

type TradingPartnerlist {
  Rcount: Int,
  ID:Int, 
  ISA06_ID: String,
  Transaction_Code : String,
  State: String,
  ISA08_ID : String,
  PayerName : String,
  PayerID : String,
  ISA06_Name :String,
  ISA08_Name :String,
  TradingPartnerName :String,
  Is_Active :String
}


type StateList {
  State:String ,   
  StateCode	:String 
}

type EncounterProcessingSummary {
  RecCount: String,  
  ClaimID: String,
  ClaimDate:String,
  ClaimTMTrackingID:String,
  Subscriber_ID: String,
  Claim_Amount: String,
  ClaimStatus: String,
  ProviderLastName : String,
  ProviderFirstName : String,
  SubscriberLastName: String,
  SubscriberFirstName : String,
  adjudication_status : String,
  ClaimLevelErrors : String,
  ClaimUniqueID:String,
  FileID:String,
  FileName: String,
  FileCrDate: String,
  FileStatus : String
}

type EncounterDashboardCount {
  TotalFiles:String,
  TotalClaims: String, 
  Accepted: String,  
  Rejected: String,  
  Accepted_Per: String,  
  Rejected_Per: String,
  Total999: String,
  Total277CA: String,
  TotalSentToQNXT: String,
  InProgress: String
}

type EncounterClaimBarchart{
From: String,
MonthNo:String,
Year:String,
To: String,
Amount : String,
TotalClaims: String,
X_axis: String,
Y_axis: String
}

type EncounterDetails {  
  ClaimID: String,
  ClaimDate:String,
  ClaimTMTrackingID:String,
  Subscriber_ID: String,
  Claim_Amount: String,
  ClaimStatus: String,
  ProviderLastName : String,
  ProviderFirstName : String,
  SubscriberLastName: String,
  SubscriberFirstName : String,
  adjudication_status : String,
  ClaimLevelErrors : String,
  AdmissionDate: String,
  BillingProviderAddress : String,
  BillingProviderCity_State_Zip : String,
  ICDCode : String,
  AccidentDate : String,
  FileID : String,
  FieldToUpdate: String
} 

type EncounterLineDetails {    
  ClaimID: String,
  ServiceLineCount: String,
  ProviderPaidAmount: String,
  ServiceDate: String,
  ProcedureDate: String,
  PaidServiceUnitCount: String  
}

type EncounterFileDetails {
  RecCount: String,  
  FileID: String,
  FileName:String,
  Sender:String,
  FileDate: String,
  FileStatus : String,
  Claimcount:String
}

type ClaimsICDCODE{
  SeqId: String,
  ICD_CODE: String,
  Year: String,
  ExtraField1: String
}

type TransactionMaster
{
  Trans_Code:String,
  Transaction_Type:String
}
type FileInCount {
  totalFile:String,
  TotalClaims: String, 
  Accepted: String,  
  Rejected: String, 
  Total999: String,
  Total277CA: String,
  TotalSentToQNXT: String,
  InProgress: String,
  Paid: String, 
  denied: String,   
  WIP: String,  
  Pending: String,
  TotalBatch: String,
  ReadytoSend: String,
  Valid: String,
  Error: String,
  ClaimSent: String
}
type ClaimsDailyAudit {  
  FileID: String,
  filename    : String,                    
  Submitted: String ,
  Accepted : String ,
  Rejected : String ,
  SentToQNXT: String, 
  Paid : String ,
  denied: String ,
  WIP: String ,
  Pending : String , 
  F277: String,
  F999  : String ,
  FileStatus : String,
  BatchName: String,
  BatchStatus: String,
  Valid: String,
  Error: String,
  ReadytoSend : String,
  ClaimSent : String,
  RecCount : String
}

type ProviderList{
  Provider : String,
}

type RemittanceViewerFileDetails {  
  RecCount: String,
  Sender    : String,                    
  Organization: String ,
  FileID : String ,
  FileName : String ,
  CheckEFTNo: String, 
  FileDate : String ,
  PayerName: String ,
  PayerID: String ,
  AccountNo : String , 
  CHECKEFTFlag: String,
  CheckEFTDt  : String ,
  Receiver : String
}

type RemittanceViewerPatientDetails {  
  RecCount: String,
  RefId : String,
  FileID : String ,
  FileName : String ,
  ClaimID: String, 
  FileDate : String ,
  ClaimReceivedDate: String ,
  PatientName: String ,
  PatientControlNo : String , 
  PayerName: String,
  TotalChargeAmt : String , 
  TotalClaimPaymentAmt : String,

}

type RemittanceViewerClaimDetails {  
  FileID: String,
  FileName:String  ,FileDate : String  ,Organization: String  
  ,Payee_IdentificationQL : String  , Payee_IdentificationCode: String   
  ,CheckEFTNo : String ,
  PayerIdentifier : String   ,PayerName : String  ,PayerID : String  ,
  CheckEFTDt : String  ,
  AccountNo : String  ,
  CHECKEFTFlag : String   
  ,ClaimID : String  ,
  PayerClaimControl: String  ,
  ClaimReceivedDate: String  ,
   PatientName: String  ,
  PatientControlNo: String  
  , TotalChargeAmt : String  ,
    TotalClaimPaymentAmt : String  ,
    PatietResAMT: String   
    , DigonisCode : String  ,
   DGNQty : String  , ClaimStatusCode : String  , FacilityCode : String  ,AdjustmentAmt : String  

}

type Data999 {  
  FileId: String,
  FileName    : String,                    
  Date: String ,
  Submitter : String ,
  id : String ,
  status: String, 
  Response : String ,
  TrasactionType: String ,
  RecCount : String
}

type RemittanceViewerClaimServiceDetails {  
  FileID: String,
  ClaimID : String,
  ServiceEndDate : String ,
  ServiceStartDate : String ,
  AdjudicatedCPT: String, 
  ChargeAmount : String ,
  PaidAmt: String ,
  AdjAmt: String ,
  SubmittedCPT : String , 
  LineControlNo: String,
  ServiceSupplementalAmount : String , 
  OriginalUnitsofServiceCount : String,
  UnitsofServicePaidCount : String,
  RecCount : String

}

type ClaimStagesInbound {  
    Stage: String,  
    Createdatetime: String
}

type Claim837RTRejectedFile {
  TotalRejectedFiles : String
}

type Query {    
    PagedData1(fileName : String!) :[PagedData1]
    PagedData2(fileName : String!) :[PagedData2]
    PagedData3 :[PagedData3]
    PagedData4(MaintainCode1 : String!, MaintainCode2 : String!, MaintainCode3 : String!)  :[PagedData4]   

    Trading_Partner(TPName : String!):[Trading_Partner]
    Trading_PartnerList(Transaction : String!, RecType: String! ):[Trading_Partnerlist]
    TransactionSetup(TPName: String!):[TransactionSetup]    

    Eligibilty270Request(HiPaaSUniqueID : String!) :[Eligibilty270Request]
    Eligibilty271Response(HiPaaSUniqueID : String!) :[Eligibilty271Response]
    EligibilityAllDtlTypewise(TypeID : String!, page : Int, State: String!, Sender: String!, StartDt: String!, EndDt: String!, TransactionID: String!, ErrorType : String! , OrderBy : String!) :[Eligibilty_DateWise]
    Eligibilty270(State: String!, Sender: String!, StartDt: String!, EndDt: String!, TransactionID: String!):[Eligibilty270]
    Eligibilty271ErrorwiseCount(State: String!, Sender: String!, StartDt: String!, EndDt: String!, TransactionID: String!, ErrorType : String!):[Eligibilty271ErrorwiseCount]
    DashboardBarChartData(State: String!, Sender: String!, StartDt: String!, EndDt: String!, TransactionID: String!, ChartType: String!):[DashboardBarChartData]

    ClaimStatus276Request(HiPaaSUniqueID : String!) :[ClaimStatus276Request]
    ClaimStatus277Response(HiPaaSUniqueID : String!) :[ClaimStatus277Response]
    ClaimStatusAllDtlTypewise(TypeID : String!, page : Int) :[ClaimStatus_DateWise]
    ClaimStatus276:[ClaimStatus276]

    Claim837RTDashboardCount(State : String!,Sender: String!,StartDt: String!, EndDt: String!, Provider: String!,Type : String!,RecType : String):[Claim837RTDashboardCount]
    Claim837RTClaimBarchart(State : String!,Sender: String!, StartDt: String!, EndDt: String!, Provider: String!, ChartType: String!,Type : String!,RecType : String ) : [Claim837RTClaimBarchart]
    Claim837RTProcessingSummary (Sender: String!,State : String!, Provider: String!,page : Int,StartDt: String!, EndDt: String!,Claimstatus: String!,FileID : String!,Type : String!,OrderBy : String!,RecType : String) : [Claim837RTProcessingSummary]

    EventLogData(Transaction : String! , HiPaaS_UUID: String!) :[EventLogData]
    ClaimRequest(HiPaaSUniqueID : String!) :[ClaimRequest]
    ClaimStatus277(HiPaaSUniqueID : String!) :[ClaimStatus277]
    ClaimRequest_Datewise(TypeID : String!, page : Int, State: String!, Sender: String!, StartDt: String!, EndDt: String!, TransactionID: String!, ErrorType : String!, OrderBy : String!) :[ClaimRequest_Datewise]
    ClaimRequest276(State: String!, Sender:String!, StartDt:String!, EndDt:String!, TransactionID:String!):[ClaimRequest276]
    ClaimStatuswiseCount(State: String!, Sender:String!, StartDt:String!, EndDt:String!, TransactionID:String!):[ClaimStatuswiseCount]
    
    ErrorType_List(Transaction : String!):[ErrorType_List]
    Userrole(role_id: Int!):[Userrole]    
    User(Userid: Int!, Email: String!):[User]
    UserLogin(Email: String!, Password: String!):[UserLogin]
    UserwiseMenu(role_id: Int!, menutype : String, For :String):[UserwiseMenu]  
    
    Claim837RTDetails (ClaimID : String!,FileID : String!, SeqID : Int!):[Claim837RTDetails]
    Claim837RTLineDetails (ClaimID : String!,FileID : String!, page: Int):[Claim837RTLineDetails]
    Claim837RTFileDetails (Sender: String!,State : String!, Provider: String!,StartDt: String!, EndDt: String!,Claimstatus: String!,Type : String! , page: Int , OrderBy : String!,RecType : String) : [Claim837RTFileDetails]
    
    Claim835Dashboard(RecType : String): [Claim835Count]
    Claim835Status(ChartType: String!, RecType : String): [Claim835StatusCount]

    loopid(flag : String!,transaction : String!):[loopid]
    segment(flag : String!,transaction : String!,loopid : String!):[segment]
    element(flag : String!,transaction : String!,loopid : String!,segment: String!):[element]
    Rules(transaction : String!):[Rules]
    Validate_Trading_Partner(ISA06_ID: String, Transaction_Code : String, State: String, ISA08_ID : String, PayerID :String ): Boolean    

    TradingPartnerlist(ID: Int!, page: Int , OrderBy : String!, Transaction : String, State: String, PayerID :String , PayerName : String, ISA06_ID: String, ISA06_Name :String, ISA08_ID: String, ISA08_Name :String):[TradingPartnerlist]
    StateList(UserId : Int!, Flag: Int!  ):[StateList]
    TransactionMaster:[TransactionMaster]

    EncounterDashboardCount(State : String!,Sender: String!,StartDt: String!, EndDt: String!, Provider: String!,Type : String!,RecType : String):[EncounterDashboardCount]
    EncounterClaimBarchart(State : String!,Sender: String!, StartDt: String!, EndDt: String!, Provider: String!, ChartType: String!,Type : String! ,RecType : String) : [EncounterClaimBarchart]
    EncounterProcessingSummary (Sender: String!,State : String!, Provider: String!,page : Int,StartDt: String!, EndDt: String!,Claimstatus: String!,FileID : String!,Type : String!,OrderBy : String!,RecType : String) : [EncounterProcessingSummary]
    EncounterDetails (ClaimID : String!,FileID : String!,RecType : String):[EncounterDetails]
    EncounterLineDetails (ClaimID : String!,FileID : String!,RecType : String):[EncounterLineDetails]
    EncounterFileDetails (Sender: String!,State : String!, Provider: String!,StartDt: String!, EndDt: String!,Claimstatus: String!,Type : String! , page: Int , OrderBy : String!,RecType : String) : [EncounterFileDetails]
    ClaimsICDCODE:[ClaimsICDCODE]
    FileInCount(submitter : String!,fromDt: String!, ToDt: String!, RecType : String, Provider: String!,State : String!):[FileInCount]
    ClaimsDailyAudit (submitter : String!,fromDt: String!, ToDt: String!, RecType : String, page: Int, Provider: String!, OrderBy : String!,State : String!):[ClaimsDailyAudit]

    ProviderList(Transaction : String!, RecType : String, Provider: String!): [ProviderList]
    RemittanceViewerFileDetails (State : String!, Sender : String!, Organization : String!, EFTStartDt: String!,EFTEndDt : String!, ClaimReceivedStartDt : String, ClaimReceivedEndDt: String!,OrderBy : String!,page:Int) : [RemittanceViewerFileDetails]
    RemittanceViewerPatientDetails (State : String!, Sender : String!, Organization : String!, EFTStartDt: String!,EFTEndDt : String!, ClaimReceivedStartDt : String, ClaimReceivedEndDt: String!,OrderBy : String!,page:Int , FileID : String!) : [RemittanceViewerPatientDetails]
    RemittanceViewerClaimDetails (FileID : String!,ClaimID : String!) : [RemittanceViewerClaimDetails]
    
    ClaimStagesInbound(ClaimID : String!,FileID: String!):[ClaimStagesInbound]
    Data999 (RecType: String!, TrasactionType: String!, FileId:  String!, FileName: String!, StartDt: String!, EndDt: String!, State: String!,page : Int,OrderBy : String!):[Data999]
    RemittanceViewerClaimServiceDetails (FileID : String!,ClaimID : String!,page : Int) : [RemittanceViewerClaimServiceDetails]

    Claim837RTRejectedFile(State : String!,Sender: String!,StartDt: String!, EndDt: String!, Provider: String!,Type : String!,RecType : String):[Claim837RTRejectedFile]
  }

  type Mutation {
    updateuser(Id: Int, roleid : Int, FirstName: String, LastName: String, Email: String, PhoneNumber: String, PasswordHash:String, is_Active:Int): [String]
    InactiveUser(Id: Int, Email: String, is_Active: Int): [String]
    updateuserrole(roleid:Int,role_description:String, is_Active:Int): [Userrole]
    updateuserwisemenu(roleid: Int, uncheck : String, check: String, unchkeditor: String, chkeditor: String): [String]
    ChangePassword(Id: Int, OldPassword : String, NewPassword : String, ForgotOrNot : Int ): [String]
    MenuMasterUpdate(uncheck : String, check: String, unchkeditor: String, chkeditor: String): [String]
    updateIgnoreCode(uncheck : String, check: String): [String]       
    SP_Trading_Partner_Save(ID:Int, Trading_Partner_Name:String , Identifier:String, Functional_Ack_Options : String,
                            Doc_Envelope_Option: String, Element_Delimiter: String,
                            Segment_Termination_Character : String, 
                            Filter_Functional_Acknowledgments : Boolean,
                            Reject_Duplicate_ISA:Boolean ,
                            Validate_Outbound_Interchanges:Boolean,
                            Outbound_Validation_Option :String ,
                            Authorization_Info_Qualifier :String,
                            Authorization_Info_ID :String,
                            Security_Information_Qualifier :String,
                            Security_Information_Id :String,
                            Interchange_ID_Qualifier :String,
                            Interchange_ID :String,
                            Interchange_Standard_ID :String,
                            Interchange_Version :String,
                            ISA14:Boolean,
                            Test_Indicator :String,
                            Component_Separator :String,
                            X12 :String,
                            Application_Code :String,
                            Responsible_Agency_Code :String,
                            GSVersion :String,
                            Communication_Type :String,
                            Use_Default_Settings:Boolean,
                            Host :String,
                            Port :String,
                            UserName :String,
                            Password :String,
                            Directory :String,
                            Create_Directory:Boolean,
                            File_Naming_Options :String, RecType: [String]): [String]
                            

    SP_Save_TransactionSetup(ID:Int, 
                            Trading_Partner:String , 
                            Transaction_Type:String, 
                            Acceptance_Criteria : String,
                            Campanion_Guide: String): [String]
    
    TradingPartnerSave(ID:Int, ISA06_ID: String, Transaction_Code : String, State: String, ISA08_ID : String, PayerName : String, PayerID :String, ISA06_Name: String, ISA08_Name: String, TradingPartnerName: String) : [Message]
    InActiveTradingPartner(ID: Int, Is_Active: Int): [String]

    updateEncounterICDCode(ClaimID : String, FileID: String, ICDCode: String): [String]
    updateICDCode(ClaimID : String, FileID: String, ICDCode: String): [String]
    }    
`;

module.exports = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers,
  Mutation: true
});
