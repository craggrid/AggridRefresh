import { OnInit, Component, Output, EventEmitter, ViewChild, HostListener, Inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ColumnApi, GridApi } from 'ag-grid-community';
import { GridOptions } from "ag-grid";
import "ag-grid-enterprise";
import { CustomTooltip } from "../helper/aggridcustomtooltip/customtooltip.component";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { UsertitleComponent } from './usertitle.component';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProgramDashboardService } from '../services/program-dashboard.service';
import { Router } from '@angular/router';
import { SearchOrgModel } from '../model/searchorgmodel.model';
import { ProgramDashboardVO } from '../model/maintaindealforall.model';
import { TranslateService } from '@ngx-translate/core';
import { Loggedinusersection } from '../model/loggedinusersection.model';
import { SharedcomponentComponent } from '../helper/sharedcomponent/sharedcomponent.component';
import { filterdetails } from '../model/filterdetails.model';
import { CustomerDetailComponent } from './customerDetail.component';
import { ProgramgridvalidationComponent } from '../helper/aggridcellvalidation/programgridvalidation.component';

import { DOCUMENT } from "@angular/platform-browser";
//import { GridvalidationComponent } from '../helper/aggridcellvalidation/gridvalidation.component';
//import { ProgramgridvalidationComponent } from '../helper/aggridcellvalidation/programgridvalidation.component';
export interface State {
  flag: string;
  name: string;
  population: string;
}

@Component({
  selector: 'app-program-dashboard',
  templateUrl: '../views/programDashboard.component.html',
  styleUrls: ['../styles/programDashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class ProgramDashboardComponent implements OnInit {
  showGrid = true;
  public url: any;
  baseUrl: any = this.getUrlIP(); public columnDefs;
  public defaultColDef;
  public gridOptions: GridOptions;
  public api: GridApi;
  public columnApi: ColumnApi;
  public rowData: any;
  public frameworkComponents;
  errorList: number[] = [];
  newCount = 1;
  recCountChkBox = 0;
  currCountChkBox = 0;
  orgIdControl: FormControl = new FormControl();
  public filteredOptions: Observable<string[]>;
  selectedProgramValue;
  programID;
  public mantenanceFlag: boolean = false;
  public programTypeValue: any;
  searchOrgModel: SearchOrgModel = new SearchOrgModel;
  public enableDashboard: boolean = true;
  public searchAuto: boolean = true;
  showCustomerDetail$: Observable<any>;
  public programData: ProgramDashboardVO[];
  allProgramType: any;
  public programType: any;
  public userInfoResult: any;
  loggedinusersection: Loggedinusersection = new Loggedinusersection();
  public responseMessage: string;
  filterdetailVO: filterdetails[] = [];
  public orgIDValueList: any[];
  public tempOrgIDValueList: any[];
  public myMap: Map<string, string>;
  //This field is to enable readonly mode at field level
  public isProgramActiveDiv: boolean = false;
  public isProgramActiveApproveDiv: boolean = false;
  programTypeUrlParam: any;
  programIDUrlParam: any;
  public fixed: boolean = false;
  @ViewChild(CustomerDetailComponent) customerDetailComponent;
  @Output() enableShowGrid = new EventEmitter<boolean>();

  rowSelection;
  type: any[] = [];
  noDataFound = false;
  constructor(private service: ProgramDashboardService, private router: Router,
    private translate: TranslateService,
    private httpClient: HttpClient, public sharedcomponent: SharedcomponentComponent,
    // public gridvalidation: GridvalidationComponent,
    public programgridvalidationComponent: ProgramgridvalidationComponent,
    @Inject(DOCUMENT)
    private document: Document
  ) {
    this.showGrid = true;
    var userLang = sessionStorage.USER_LANG;
    if (sessionStorage.USER_LANG != null && sessionStorage.USER_LANG != "") {
      userLang = userLang.toLowerCase();
    } else {
      userLang = "en";
    }
    this.translate.use(userLang);
    this.getUserInfo();
    //Load program type from JSON file
    var programTypeByLangPath = "./assets/ProgramType/";
    var programTypeFileName = "programType_";
    var programTypeFileFormate = ".json";
    this.httpClient.get(programTypeByLangPath + programTypeFileName + userLang + programTypeFileFormate).subscribe(
      data => {
        this.allProgramType = data;
        this.getProgramType(this.allProgramType);
        this.setColumnDef();
        // this.api.setColumnDefs(this.columnDefs);
      },
      (err: HttpErrorResponse) => {
        console.log(err.message);
      }
    );
    this.loadOrgIdOnAutoComplete();
    console.log('called constructor');
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    //let num = this.document.body.scrollTop;
    let num = this.document.documentElement.scrollTop
    if (num > 50) {
      this.fixed = true;
    } else if (this.fixed && num < 5) {
      this.fixed = false;
    }
  }


  userInfo = {
    userid: sessionStorage.USERID
  }

  getUserInfo() {
    this.userInfoResult = this.httpClient.post(this.baseUrl + '/loginCtrl/getUserInfo.rest', this.userInfo).subscribe(response => this.handleSuccessfulResponse(response));
  }

  handleSuccessfulResponse(response) {
    console.log("response", response);
    // this.loggedinusersection.clientRegUxFoAccess = response.entitlDet.clientRegUxFoAccess;
    // this.loggedinusersection.crCustAdminApproveAll = response.entitlDet.crCustAdminApproveAll;
    // this.loggedinusersection.crCustAdminRejectAll = response.entitlDet.crCustAdminRejectAll;
    // this.loggedinusersection.crCustAdminRequestRelease = response.entitlDet.crCustAdminRequestRelease;
    // this.loggedinusersection.crCustAdminRelease = response.entitlDet.crCustAdminRelease;
    // this.loggedinusersection.crCustAdminView = response.entitlDet.crCustAdminView;
    this.loggedinusersection.crProgramDetailsApprove = response.entitlDet.crProgramDetailsApprove;
    this.loggedinusersection.crProgramDetailsReject = response.entitlDet.crProgramDetailsReject;
    this.loggedinusersection.crProgramDetailsSave = response.entitlDet.crProgramDetailsSave;
    this.loggedinusersection.crProgramDetailsDelete = response.entitlDet.crProgramDetailsDelete;
    this.loggedinusersection.crProgramDetailsCreate = response.entitlDet.crProgramDetailsCreate;
    if (
      this.loggedinusersection.crProgramDetailsApprove &&
      this.loggedinusersection.crProgramDetailsReject && this.loggedinusersection.crProgramDetailsSave &&
      this.loggedinusersection.crProgramDetailsDelete) {
      this.isProgramActiveDiv = true;
      this.isProgramActiveApproveDiv = true;
      console.log('if block ' + this.isProgramActiveDiv);
    }
    else if (
      this.loggedinusersection.crProgramDetailsApprove ||
      this.loggedinusersection.crProgramDetailsReject) {
      this.isProgramActiveDiv = false;
      this.isProgramActiveApproveDiv = true;
      console.log('else if 1 block ' + this.isProgramActiveDiv);
    }
    else if (this.loggedinusersection.crProgramDetailsSave || this.loggedinusersection.crProgramDetailsDelete) {
      this.isProgramActiveDiv = true;
      this.isProgramActiveApproveDiv = false;
      console.log('else if 2 block ' + this.isProgramActiveDiv);
    }
    else {
      this.isProgramActiveDiv = false;
      this.isProgramActiveApproveDiv = false;
      console.log('else ' + this.isProgramActiveDiv);
    }

  }

  getProgramType(programTypeList) {
    this.programType = programTypeList;
  }

  ngOnInit() {
    //this.service.showCustomerDetail.next(false);
    //this.showCustomerDetail$ = this.service.showCustomerDetail;
    //this.setColumnDef();
    this.defaultColDef = {
      resizable: true,
      sortable: true,
      filter: true,
      customTooltip: CustomTooltip
    };
    this.rowData = null;
    this.frameworkComponents = { usertitleComponent: UsertitleComponent, customTooltip: CustomTooltip };
    this.fetchProgramData();
    console.log('called ngonit');
  }
  fetchProgramData() {
    this.service.getProgramData().subscribe((programDataResponse: any) => {
      console.log("fetchProgramData++++this.rowData====", this.rowData)
      if (programDataResponse != null) {
        this.assignRowData(programDataResponse);
        // var res = this.api.updateRowData({ add: programDataResponse });
        // this.printResult(res);
        // this.api.refreshCells(this.rowData)
      }
    });
  }
  assignRowData(response) {
    this.setColumnDef();
    this.rowData = null;
    this.rowData = response;
    var res = this.api.updateRowData({ add: response });
    this.printResult(res);
    this.api.refreshCells(this.rowData)
    this.setColumnDef();
  }
  updateProgramData() {
    this.service.getProgramData().subscribe((programDataResponse: any) => {
      // this.api.setRowData([]);
      // var newData = programDataResponse;
      this.rowData = programDataResponse;
      if (programDataResponse != null) {
        var res = this.api.updateRowData({ add: programDataResponse });
        this.printResult(res);
      }
      // this.api.updateRowData({ add: newData });
    });
  }
  loadOrgIdOnAutoComplete() {
    if (this.service.orgIDValueList !== undefined) {
      {
        if (this.service.orgIDValueList.length !== 0) {
          this.tempOrgIDValueList = this.service.orgIDValueList;
          this.orgIDValueList = this.service.orgIDValueList;
        }
      }
    } else {
      this.service.loadOrgId().subscribe((res: Array<filterdetails>) => {
        this.filterdetailVO = res;
        var orgIdStr = JSON.stringify(res);
        var obj = JSON.parse(orgIdStr);
        this.orgIDValueList = obj.map(x => x.name);
        this.service.orgIDValueList = [];
        this.service.orgIDValueList = this.orgIDValueList;
        this.tempOrgIDValueList = this.orgIDValueList;
        this.myMap = new Map(obj.map(obj => [obj.name.toLowerCase(), obj.flag]));
        console.log(this.orgIDValueList);
      });
    }
  }
  searchOrgId(orgId) {
    this.orgIDValueList = this.tempOrgIDValueList;
    if (this.tempOrgIDValueList != null || this.tempOrgIDValueList.length > 0) {
      this.orgIDValueList = this._filter(orgId, this.tempOrgIDValueList);
      if (this.orgIDValueList.length === 0) {
        this.noDataFound = true;
      }
    }
  }
  _filter(value: string, array): string[] {
    const filterValue = value.toLowerCase();
    var resultList: any[];
    if (filterValue != null || filterValue != '' || filterValue.length > 0) {
      resultList = array.filter(option => option.toLowerCase().startsWith(filterValue));
    }
    return resultList;
  }



  getColumnDef() {
    // this.columnDefs = [];
    // columns.forEach((column: string) => {
    //   let definition: ColDef = { headerName: column, field: column, width: 120 };
    //   if (column === 'PROGRAM*') {
    //     definition.cellRendererFramework = CellLinkComponent;
    //     definition.cellRendererParams = {
    //       inRouterLink: column,
    //     };
    //   } else if (column.endsWith('Date')) {
    //     //definition.valueFormatter = (data) => this.dateFormatter.transform(data.value, 'shortDate');
    //   } else if (column === 'price') {
    //     //definition.valueFormatter = (data) => this.numberFormatter.transform(data.value, '1.2-2');
    //     definition.type = 'numericColumn';
    //   }
    //   this.columnDefs.push(definition);
    // });


  }



  setColumnDef() {
    this.rowSelection = "multiple";
    var programMappings = {};
    this.programType.forEach(element => {
      programMappings[element.Id] = element.Name;
    });
    console.log("programMappings  : " + programMappings);
    this.columnDefs = [
      {
        field: 'select', headerName: '',
        cellRenderer: function (params) {
          var input = document.createElement('input');
          input.type = "checkbox";
          input.name = "select";
          input.id = "select" + params.node.data.id;
          if ((params.node.data.leads === '0' && params.node.data.cp === '0') && params.node.data.status != 'A') {
            input.disabled = false;
          } else {
            input.disabled = true;
          }
          if (params.node.data.select === "Y") {
            input.checked = true;
          }
          else {
            input.checked = false;
          }
          input.addEventListener('click', function () {
            if (params.node.data.select == 'Y') {
              params.node.data.select = 'N';
            }
            else if (params.node.data.select == 'N') {
              params.node.data.select = 'Y';
            }
            // params.value = !params.value;
            // if (params.value === true) {
            //   params.node.data.select = "N";
            // }
            // else {
            //   params.node.data.select = "Y";
            // }
          });
          return input;
        },
        tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        // cellStyle: function (params) {
        // if (params.value == 'Please enter a value') {
        //   return { color: 'red', backgroundColor: 'lightblue' };
        // }
        // else if (params.value == 'Enter only 128 char') {
        //   return { color: 'red', backgroundColor: 'lightblue' };
        // }
        // else {
        //   return { color: 'black', backgroundColor: 'white' };
        // }
        //  }
      },
      {
        field: "modifiedFlag",
        lockVisible: true,
        cellClass: "locked-visible",
        hide: true
      },
      {
        field: "programId",
        lockVisible: true,
        cellClass: "locked-visible",
        hide: true
      },
      {
        field: "makerId",
        lockVisible: true,
        cellClass: "locked-visible",
        hide: true
      },
      {
        field: "checkerId",
        lockVisible: true,
        cellClass: "locked-visible",
        hide: true
      },
      {
        field: 'programName', headerName: 'PROGRAM*', headerTooltip: 'PROGRAM',
        cellClassRules: params => ((params.node.data.leads === '0' && params.node.data.cp === '0') && this.isProgramActiveDiv) ? 'editable-cell' : 'readonly-cell',
        editable: params => ((params.node.data.leads === '0' && params.node.data.cp === '0') && this.isProgramActiveDiv),

        cellRenderer: (params) => {
          if (params.node.data.status == "A") {
            const link = document.createElement("a");
            //link.href = this.$router.resolve(route).href;
            link.innerText = params.value;
            link.addEventListener("click", () => {
              this.passData(params.value);
            });
            return link;
          } else {
            const altlink = document.createElement("span");
            altlink.innerText = params.value;
            return altlink;
          }
        },
        tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        cellStyle: function (params) {
          if (params.value == 'Program Name should not be empty') {
            return { color: 'red', backgroundColor: 'lightblue' };
          }
          else if (params.value == 'Please enter a value') {
            return { color: 'red', backgroundColor: 'lightblue' };
          }
          else if (params.value == 'Program Name should not be more than 105 characters') {
            return { color: 'red', backgroundColor: 'lightblue' };
          }
          else {
            return { color: 'black', backgroundColor: 'white' };
          }
        }
      },
      {
        field: 'type', headerName: 'TYPE*', headerTooltip: 'TYPE',
        cellClassRules: params => ((params.node.data.leads === '0' && params.node.data.cp === '0') && this.isProgramActiveDiv) ? 'editable-cell' : 'readonly-cell',
        editable: params => ((params.node.data.leads === '0' && params.node.data.cp === '0') && this.isProgramActiveDiv),
        cellEditor: "select",
        cellEditorParams: {
          values: extractValues(programMappings)
        }, tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        cellStyle: function (params) {


          if (params.value == 'Program Type should not be empty') {
            return { color: 'red', backgroundColor: 'lightblue' };
          }
          else if (params.value == 'Please enter a value') {
            return { color: 'red', backgroundColor: 'lightblue' };
          } else {
            return { color: 'black', backgroundColor: 'white' };
          }

          // if(this.prgmErrorCode==2){
          //   return { color: 'red', backgroundColor: 'lightblue' };
          // }

        },
        valueFormatter: function (params) {
          return lookupValue(programMappings, params.value);
        },
        valueParser: function (params) {
          return lookupKey(programMappings, params.newValue);
        }
        //   field: 'type', headerName: 'TYPE*', editable: true,
        //   cellRenderer: "usertitleComponent",
        //   cellEditor: "agRichSelectCellEditor",
        //   cellEditorParams: {
        //     values: this.type,
        //     rowSelection: "multiple",
        //     cellRenderer: "usertitleComponent"
        // }
      },
      {
        field: 'leads', headerName: 'LEADS', headerTooltip: 'LEADS',
        tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        // cellStyle: function (params) {
        //   if (params.value == 'Please enter a value') {
        //     return { color: 'red', backgroundColor: 'lightblue' };
        //   }
        //   else if (params.value == 'Enter only 128 char') {
        //     return { color: 'red', backgroundColor: 'lightblue' };
        //   }
        //   else {
        //     return { color: 'black', backgroundColor: 'white' };
        //   }
        // }
      },
      {
        field: 'cp', headerName: 'CP', headerTooltip: 'CP',
        tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        cellStyle: function (params) {
          if (params.value == 'Please enter a value') {
            return { color: 'red', backgroundColor: 'lightblue' };
          }
        }
      },
      {
        field: 'status', headerName: 'STATUS', headerTooltip: 'STATUS',
        tooltipComponent: "customTooltip",
        tooltipValueGetter: function (params) {
          return { value: params.value };
        },
        // cellStyle: function (params) {
        //   if (params.value == 'Please enter a value') {
        //     return { color: 'red', backgroundColor: 'lightblue' };
        //   }
        //   else if (params.value == 'Enter only 128 char') {
        //     return { color: 'red', backgroundColor: 'lightblue' };
        //   }
        //   else {
        //     return { color: 'black', backgroundColor: 'white' };
        //   }
        // }
      }];
  }




  public gridColumns: any[] = [];
  public conditionalFields: any[] = [];

  onCellFocused(event) {
    var selectedRows = this.api.getSelectedRows();
    var getIndex = event.rowIndex;
    var Index = getIndex.toString();
    var rowNode = this.api.getRowNode(Index);
    var colId = event.column.getId();
    this.gridColumns = ["programName", "type"];

    this.conditionalFields = ["programName"];
    for (var i = 0; i <= this.gridColumns.length; i++) {
      if (colId == this.gridColumns[i]) {
        this.programgridvalidationComponent.validateProgramDashBoardSection(colId, selectedRows[0], rowNode, this.gridColumns[i], this.gridColumns)
      }
    }
    for (var j = 0; j <= this.conditionalFields.length; j++) {
      if (colId == this.conditionalFields[j]) {
        this.programgridvalidationComponent.validCondionalProgramDashBoard(colId, selectedRows[0], rowNode, this.gridColumns[j], this.conditionalFields)
      }
    }
  }

  onCellValueChanged(event) {
    var selectedRows = this.api.getSelectedRows();

    var getIndex = event.rowIndex;
    var Index = getIndex.toString();
    var rowNode = this.api.getRowNode(Index);
    var colId = event.column.getId();
    if (colId == "programName" || colId == "type") {
      rowNode.setDataValue("modifiedFlag", "Y");
    }


    if (colId == "programName") {
      if (selectedRows[0].programName.length > 105) {
        rowNode.setDataValue("programName", this.sharedcomponent.getMsgByKey("msg_user_105_char"));
      }

      if (selectedRows[0].programName == null || selectedRows[0].programName == '' || selectedRows[0].programName.length == 0) {
        rowNode.setDataValue("programName", this.sharedcomponent.getMsgByKey("msg_user_prgmName_empty"));
      }

      // this.prgmErrorCode = 1;

    }
    if (colId == "type") {


      if (selectedRows[0].type == null || selectedRows[0].type == '' || selectedRows[0].type.length == 0) {
        rowNode.setDataValue("programType", this.sharedcomponent.getMsgByKey("msg_user_prgmType_empty"));
      }

      //this.prgmErrorCode = 2;

    }

  }

  onGridReady(params) {
    this.api = params.api;
    this.columnApi = params.columnApi;
    this.api.sizeColumnsToFit();

    this.columnApi.autoSizeAllColumns();
  }

  getUrlIP() {
    var getUrl = window.location.origin;
    var newPathname = "";
    newPathname += "/clientreg";
    this.url = getUrl + newPathname;
    return newPathname;
  }
  getRowData() {
    var newData = [{
      select: "N",
      programName: "S",
      type: 0,
      leads: 0,
      cp: 0,
      status: "S",
    }, {
      select: "N",
      programName: "B",
      type: 1,
      leads: "1",
      cp: "2",
      status: "A",
    }];
    var res = this.api.updateRowData({ add: newData });
    this.printResult(res);
  }

  printResult(res) {
    if (res.add) {
      res.add.forEach(function () {
      });
    }
    if (res.remove) {
      res.remove.forEach(function () {
      });
    }
    if (res.update) {
      res.update.forEach(function () {
      });
    }
  }
  getGridData() {
    var rowDataTmp = [];
    this.api.forEachNode(function (node) {
      rowDataTmp.push(node.data);
    });
    this.rowData = rowDataTmp;
    return this.rowData;
  }
  onAddRow() {
    var recCount = this.getRecordCount();
    var newItem = this.createNewRowData(recCount);
    var res = this.api.updateRowData({ add: [newItem] });
    this.printResult(res);
  }
  getRowWiseData() {
    var rowDataTmp = [];
    this.api.forEachNode(function (node) {
      rowDataTmp.push(node.data);
    });
    this.rowData = rowDataTmp;

  }
  getRecordCount() {
    var recCount = 0;
    this.api.forEachNode(function () {
      recCount = recCount + 1;
    });
    return recCount;
  }

  createNewRowData(recCount) {
    this.recCountChkBox = recCount;
    this.currCountChkBox = recCount;
    var newData = {
      select: "N",
      modifiedFlag: "Y",
      programName: "",
      type: "",
      leads: "0",
      cp: "0",
      status: "",
    };
    this.newCount++;
    return newData;
  }
  onBtExportExcel() {

    var rowCount = this.api.getDisplayedRowCount();
    if (rowCount > 0) {
      this.api.exportDataAsExcel();
    } else {
      alert('No data to export');
    }

  }

  onBtExportCSV() {
    var rowCount = this.api.getDisplayedRowCount();
    if (rowCount > 0) {
      this.api.exportDataAsCsv();
    } else {
      alert('No data to export');
    }
  }
  onRemoveSelected() {
    alert('remove')
    var selectedData = this.api.getSelectedRows();

    // selectedData.forEach(function (selectedRow, index) {
    //   var curr = selectedRow.currencyCode;
    //   var accNum = selectedRow.accountNumber;
    //   if (this.accountCurrMap.has(curr)) {
    //     if (this.accountCurrMap.get(curr) === accNum) {
    //       this.accountCurrMap.delete(curr);
    //     }
    //   }
    //   if (this.checkBoxCurrMap.has('select' + index)) {
    //     this.checkBoxCurrMap.delete('select' + index);
    //   }
    // }, this);
    var res = this.api.updateRowData({ remove: selectedData });
    this.printResult(res);

  }
  passData(data) {
    this.service.showCustomerDetail.next(true);
    this.selectedProgramValue = data;
    var programD: ProgramDashboardVO[];
    programD = this.rowData;
    programD.forEach((row: ProgramDashboardVO) => {
      if (row.programName == this.selectedProgramValue) {
        this.programTypeUrlParam = row.type;
        this.programIDUrlParam = row.programId;
      }
    });
    this.router.navigate(['custdetail', this.selectedProgramValue, this.programTypeUrlParam, this.programIDUrlParam]);
  }
  @Output() redirect: EventEmitter<any> = new EventEmitter();
  searchOrgModel_searchOrg: SearchOrgModel = new SearchOrgModel;
  changeComponent(val) {
    this.searchOrgModel.orgId = val;
    this.searchOrgModel.userId = sessionStorage.USERID;
    this.searchOrgModel.userTimeZone = sessionStorage.USER_TIME_ZONE_ID;
    this.searchOrgModel_searchOrg.orgId = val;
    // val.status = '-1';
    // this.searchOrgModel_searchOrg.status = val.status;
    // console.log(this.searchOrgModel);
    this.service.checkOrgIDExists(this.searchOrgModel).subscribe((response) => {
      this.handleCRSuccessfulResponse(response, -1);
    });
  }
  handleCRSuccessfulResponse(response, value) {
    if (response == null || response.orgId == null || response.orgId == '') {
      alert("Organization dosen't exist.");
    }
    else {
      console.log(response);
      (<HTMLInputElement>document.getElementById("orgId")).value = response.orgId;
      this.programTypeValue = response.bankProgramType == 'P' ? 1 : 0;
      this.mantenanceFlag = response.processType == 'N' ? false : true;
      this.redirect.emit(value);
      this.router.navigate(['maintenancedeal', response.orgId, value, this.mantenanceFlag, this.programTypeValue]);
      this.enableDashboard = !this.enableDashboard;
      this.searchAuto = false;
      this.mantenanceFlag = false;
    }
  }
  onSelectionChanged() {

    var selectedRows = this.api.getSelectedRows();
    var selectedRowsString = "";

    selectedRows.forEach(function (selectedRow) {


      selectedRowsString = selectedRow.programName;


    });
    return selectedRowsString;
  }

  ApiHere() {



  }

  approveProgramDashbord() {
    this.setColumnDef();

    var prog_name: any = [];
    var prog_nameARState: any = [];
    var prog_name_maker_checker_same: any = [];//only for FED
    var prog_nameLst: any[] = [];
    var prog_nameARStateLst: any[] = [];
    var prog_name_maker_checker_sameLst: any[] = [];
    this.getRowWiseData();
    var programLst: ProgramDashboardVO[] = [];
    this.programData = [];
    this.programData = this.rowData;
    console.log(this.rowData);
    this.responseMessage = "";
    this.programData.forEach(function (row: ProgramDashboardVO) {
      var selectedFlagCheck = row.select;
      if (selectedFlagCheck == 'Y') {

        row.checkerId = (row.checkerId == null) ? sessionStorage.USERID : row.checkerId;
        if (row.status == 'A' || row.status == 'R') {
          //alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApproveReject_01 :"+prog_name));
          prog_nameARStateLst.push(row.programName);
        } else if (row.makerId == row.checkerId) {
          prog_name_maker_checker_sameLst.push(row.programName);
        } else {
          programLst.push(row);
          prog_nameLst.push(row.programName);
        }
      }




    });

    let chekFlag = true;
    if (prog_name_maker_checker_sameLst.length != 0) {
      prog_name_maker_checker_same = prog_name_maker_checker_sameLst.toString().replace(/,\s*$/, "");
      this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_approver_same_01") + " : " + prog_name_maker_checker_same + "\n";
      chekFlag = false;
    }
    //cannot reject
    if (prog_nameARStateLst.length != 0) {
      prog_nameARState = prog_nameARStateLst.toString().replace(/,\s*$/, "");
      this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApproveReject_01") + " : " + prog_nameARState + "\n";
      chekFlag = false;
    } else if (prog_nameLst.length != 0) {
      prog_name = prog_nameLst.toString().replace(/,\s*$/, "");
    }
    if (chekFlag && programLst.length === 0) {

      alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApprove_01"));

    }
    if (programLst.length != 0) {
      this.service.approveProgramDashbord(programLst).subscribe((response: any) => {
        this.errorList = response;
        if (this.errorList != null && this.errorList.length > 0) {
          if (this.errorList[0] == 1000000) {
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_approve_01") + ": " + prog_name + " \n";
            this.enableShowGrid.next(false);
            this.showMessageandLoadData('success');
          } else if (this.errorList[0] == 1000022) {
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_approver_same_01") + " \n";
            this.showMessageandLoadData('');
          }
          else if (this.errorList[0] == 1000015) {
            //alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_approver_same_01")); 
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_approver_same_01") + " \n";
            this.showMessageandLoadData('');
          } else {
            //alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_11")) ;
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_11") + " \n";

            this.showMessageandLoadData('');

          }

        }

      });

    } else {
      this.showMessageandLoadData('');
    }
    // if(this.responseMessage != null && this.responseMessage.length != 0){
    //   alert(this.responseMessage); 
    //   this.responseMessage = "";
    // }
  }
  saveProgramDashbord() {

    this.setColumnDef();
    this.getRowWiseData();
    this.responseMessage = "";
    var prog_name: any; var progNameLst: any[] = [];
    var programLst: ProgramDashboardVO[] = [];
    this.programData = [];
    this.programData = this.rowData;
    console.log(this.rowData);
    var emptyProgName_Type = false;
    var emptyrowNo: any = [];
    if (this.programData !== undefined)
      this.programData.forEach(function (row: ProgramDashboardVO, index) {

        var selectedCheck = row.select;
        row.makerId = sessionStorage.USERID;
        if (selectedCheck == 'Y') {
          console.log(row);
          if (row.programName.trim() != '' && row.programName.trim().length !== 0 && row.programName.trim() !== 'Please enter a value' && row.type.trim().length !== 0 && row.programName.trim() !== 'Program Name should not be empty' && row.programName.trim() !== 'Program Name should not be more than 105 characters' && row.type.trim() != '' && row.type.trim() != 'Program Type should not be empty') {
            row.status = 'S';
            programLst.push(row);
            progNameLst.push(row.programName);
            prog_name = progNameLst.toString().replace(/,\s*$/, "");
            // if (modifiedFlagCheck == 'Y') {
            //   mod_prog_name.push(row.programName);
            // }
          } else {
            emptyrowNo.push(index + 1);
            emptyProgName_Type = true;
          }

        }
      });

    // if (mod_prog_name.length != 0) {
    //   alert('no new details to be saved');
    // }

    if (programLst.length === 0 && !emptyProgName_Type) {
      alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noDelete_01"));
    }

    else if (programLst.length > 0) {
      this.service.saveProgramDash(programLst).subscribe((response: any) => {
        this.errorList = response;
        if (this.errorList != null && this.errorList.length > 0) {
          if (this.errorList[0] == 1000000) {
            this.showGrid = false;
            this.enableShowGrid.next(false);
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_01") + ":" + prog_name + " \n";
          }
          else {
            if (this.errorList[0] == 1000001) {
              this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_00") + ":" + prog_name + " \n";
            }
            else {
              this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_11") + ":" + prog_name + " \n";
            }
          }

          if (programLst.length >= 0 && emptyProgName_Type) {
            emptyrowNo = emptyrowNo.toString().replace(/,\s*$/, "");
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey('msg_program_dashboard_save_noProgram1') + " " + emptyrowNo + " " + this.sharedcomponent.getMsgByKey('msg_program_dashboard_save_noProgram2') + " \n";
          }

        }
        // this.setStatus(programLst, 'S');
        this.showMessageandLoadData('success');
        // if(this.responseMessage != null && this.responseMessage.length != 0){
        //   alert(this.responseMessage);this.responseMessage = "";
        // }
      });
    } else if (programLst.length === 0 && emptyProgName_Type) {
      emptyrowNo = emptyrowNo.toString().replace(/,\s*$/, "");
      this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey('msg_program_dashboard_save_noProgram1') + " " + emptyrowNo + " " + this.sharedcomponent.getMsgByKey('msg_program_dashboard_save_noProgram2');
      this.showMessageandLoadData('');
    }

  }
  rejectProgramDashbord() {
    this.getRowWiseData();
    this.responseMessage = "";
    var prog_name: any = [];

    var prog_nameARState: any = [];
    var prog_name_maker_checker_same: any = [];//only for FED
    var prog_nameLst: any[] = [];
    var prog_nameARStateLst: any[] = [];
    var prog_name_maker_checker_sameLst: any[] = [];
    var programLst: ProgramDashboardVO[] = [];
    this.programData = [];
    this.programData = this.rowData;
    console.log(this.rowData);
    this.programData.forEach(function (row: ProgramDashboardVO) {


      var selectedFlagCheck = row.select;
      // row.makerId = sessionStorage.USERID;
      if (selectedFlagCheck == 'Y') {
        row.checkerId = (row.checkerId == null) ? sessionStorage.USERID : row.checkerId;
        if (row.status == 'A' || row.status == 'R') {
          prog_nameARStateLst.push(row.programName);
        }
        else if (row.makerId == row.checkerId) {
          prog_name_maker_checker_sameLst.push(row.programName);
        }
        else {
          programLst.push(row);
          prog_nameLst.push(row.programName);
        }

      }

    });

    let chekFlag = true;
    if (prog_name_maker_checker_sameLst.length != 0) {
      prog_name_maker_checker_same = prog_name_maker_checker_sameLst.toString().replace(/,\s*$/, "");
      this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_reject_same_01") + " :" + prog_name_maker_checker_same + "\n";
      chekFlag = false;
    }
    //cannot reject
    if (prog_nameARStateLst.length != 0) {
      prog_nameARState = prog_nameARStateLst.toString().replace(/,\s*$/, "");
      this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApproveReject_01") + " : " + prog_nameARState + "\n";
      chekFlag = false;
    }
    else if (prog_nameLst.length != 0) {
      prog_name = prog_nameLst.toString().replace(/,\s*$/, "");
    }


    if (programLst.length === 0 && chekFlag) {
      //this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApprove_01")+ "\n" ;
      alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noApprove_01"));

    }






    if (programLst.length != 0) {

      this.service.rejectProgramDash(programLst).subscribe((response: any) => {
        this.errorList = response;
        if (this.errorList != null && this.errorList.length > 0) {


          if (this.errorList[0] == 1000000) {
            this.showGrid = false;
            this.enableShowGrid.next(false);
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_reject_01") + ": " + prog_name + " \n";
            // if (prog_name_maker_checker_same != null && prog_name_maker_checker_same.length > 0) {

            //   this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_reject_01") + " :" + prog_name + " \n" +
            //     this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_reject_same_01") + " : " + prog_name_maker_checker_same;

            // }
            // else {
            //   this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_reject_01") + ": " + prog_name + " \n";              
            // }
            this.showMessageandLoadData('success');
          } else if (this.errorList[0] == 1000022) {
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_reject_same_01") + " \n";
            this.showMessageandLoadData('');
          }
          else if (this.errorList[0] == 1000015) {
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_maker_reject_same_01") + " \n";
            this.showMessageandLoadData('');
          } else {
            this.responseMessage = this.responseMessage + this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_11") + "\n"
            this.showMessageandLoadData('');
          }






        }

      });
    } else {
      this.showMessageandLoadData('');
    }
    // if(this.responseMessage != null && this.responseMessage.length != 0){
    //   alert(this.responseMessage);
    //   this.responseMessage = "";
    // }
  }

  showMessageandLoadData(suceessMsg) {
    if (suceessMsg == 'success') {

      if (this.responseMessage != null && this.responseMessage.length != 0 && this.responseMessage != '') {
        alert(this.responseMessage);
        this.enableShowGrid.next(true);
        this.responseMessage = "";
      }
      //this.fetchProgramData();

      this.showGrid = true;
      this.uncheckall();
      console.log('if fetch');
    }
    else {
      if (this.responseMessage != null && this.responseMessage.length != 0 && this.responseMessage != '') {
        alert(this.responseMessage);
        this.responseMessage = "";
      }
      console.log('else fetch');

      this.uncheckall();
    }

  }
  deleteProgramDashbord() {
    this.getRowWiseData();
    var softProgName; var totProgname;
    var prog_nameLst: any[] = [];
    var softProgNameLst: any[] = [];
    var totPrognameLst: any[] = [];
    var softDeleteLst: ProgramDashboardVO[] = [];
    var programLst: ProgramDashboardVO[] = [];
    this.programData = this.rowData;

    console.log(this.rowData);

    this.programData.forEach(function (row: ProgramDashboardVO) {
      var checkboxFlagCheck = row.select;
      var leadFlagCheck = row.leads;
      var cpFlagCheck = row.cp;
      var statusFlagCheck = row.status;
      var progNameFlagCheck = row.programName;
      var progTypeFlagCheck = row.type;
      row.makerId = sessionStorage.USERID;
      if (checkboxFlagCheck == 'Y' && leadFlagCheck === '0' && cpFlagCheck === '0' && (statusFlagCheck !== '' || statusFlagCheck.length !== 0) && (progNameFlagCheck.trim() !== '' || progNameFlagCheck.trim().length !== 0 || progNameFlagCheck.trim() !== 'Please enter a value' || progNameFlagCheck.trim() !== 'Program Name should not be empty' || progNameFlagCheck.trim() !== 'Program Name should not be more than 105 characters') && (progTypeFlagCheck.trim() != '' || progTypeFlagCheck.trim().length !== 0 || progTypeFlagCheck.trim() != 'Program Type should not be empty')) {
        console.log(row);
        prog_nameLst.push(row.programName);
        programLst.push(row);
      }
      // && (progNameFlagCheck.trim() === '' || progNameFlagCheck.trim().length === 0 || progNameFlagCheck.trim() === 'Please enter a value' || progNameFlagCheck.trim() === 'Program Name should not be empty' || progNameFlagCheck.trim() === 'Program Name should not be more than 105 characters') && (progTypeFlagCheck.trim() == '' || progTypeFlagCheck.trim().length === 0 || progTypeFlagCheck.trim() === 'Program Type should not be empty')
      if (checkboxFlagCheck == 'Y' && leadFlagCheck === '0' && cpFlagCheck === '0' && (statusFlagCheck === '' || statusFlagCheck.length === 0)) {
        softProgNameLst.push(row.programName);
        softDeleteLst.push(row);
        softProgName = softProgNameLst.toString().replace(/,\s*$/, "");
      }


      /*  else{
          alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noDelete_01"));
        }*/
    });
    if (prog_nameLst.length !== 0) {
      totPrognameLst.push(prog_nameLst);
    } if (softProgNameLst.length !== 0) {
      totPrognameLst.push(softProgNameLst);
    }
    totProgname = totPrognameLst.toString().replace(/,\s*$/, "");
    if (programLst.length === 0 && softDeleteLst.length === 0) {
      alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_noDelete_01"));
    }
    else if (programLst.length > 0) {
      this.service.deleteProgramDash(programLst).subscribe((response: any) => {
        this.errorList = response;
        // alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_delete_01")+":"+prog_name);
        //     this.fetchProgramData();

        if (this.errorList != null && this.errorList.length > 0) {
          if (this.errorList[0] == 1000000) {
            var res = this.api.updateRowData({ remove: programLst });
            this.printResult(res);
            if (softDeleteLst.length !== 0) {
              var res = this.api.updateRowData({ remove: softDeleteLst });
              this.printResult(res);
            }
            this.uncheckall();
            this.fetchProgramData();
            alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_delete_01") + ": " + totProgname);
          } else {
            alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_save_11") + ": " + totProgname);

          }
        }
      });
    } else if (programLst.length === 0 && softDeleteLst.length !== 0) {
      this.uncheckall();
      this.fetchProgramData();
      alert(this.sharedcomponent.getMsgByKey("msg_program_dashboard_delete_01") + ": " + softProgName);
    }
  }
  enableDashboardChild(data) {
    this.enableDashboard = data;
  }
  uncheckall() {
    this.getRowWiseData();
    this.programData = this.rowData;
    this.programData.forEach(function (row: ProgramDashboardVO) {
      row.select = 'N';
    });
  }
  setStatus(dataList, status) {
    this.getRowWiseData();
    this.programData = this.rowData;
    this.programData.forEach((row: ProgramDashboardVO) => {
      dataList.forEach((selectedData: ProgramDashboardVO) => {
        if (row.programName === selectedData.programName) {
          row.status = status;
        }
      });
    });
  }
}
function extractValues(mappings) {

  return Object.keys(mappings);
}

function lookupValue(mappings, key) {

  return mappings[key];
}

function lookupKey(mappings, name) {
  for (var key in mappings) {
    if (mappings.hasOwnProperty(key)) {
      if (name === mappings[key]) {
        return key;
      }
    }
  }
}