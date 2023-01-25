
let mainFrame = document.querySelector("iframe.pageControl");

var running = false;
var style = document.createElement('style');
style.innerHTML = ".notif-container{width:60px;height:60px;margin:0 auto 0;-webkit-perspective:1000;-webkit-backface-visibility:hidden;background:transparent;position:fixed;bottom:40px;right:40px}.notif-pulse-button{position:relative;top:50%;left:50%;margin-left:-50px;margin-top:-50px;display:block;width:60px;height:60px;font-size:1.1em;font-weight:light;font-family:'Trebuchet MS',sans-serif;text-transform:uppercase;text-align:center;line-height:60px;letter-spacing:-1px;color:white;border:0;border-radius:50%;background:#c0392b;cursor:pointer;transition:all .2s ease-in-out}.notif-pulse-button:hover{-webkit-animation:none;transform:scale(1.05)}@keyframes pulse{0%{transform:scale(.9);box-shadow:0 0 0 40px rgba(39,174,96,0.3)}70%{transform:scale(1);box-shadow:0 0 0 40px rgba(39,174,96,0)}100%{transform:scale(.9);box-shadow:0 0 0 0 rgba(39,174,96,0)}}";
document.head.appendChild(style);


var refreshInterval = null;

var container = document.createElement("div");
var button = document.createElement("span");
var i = document.createElement("i");

container.setAttribute("class","notif-container");
button.setAttribute("class","notif-pulse-button");
i.setAttribute("class","fa fa-bell");

button.appendChild(i);
container.appendChild(button);

document.body.appendChild(container);

button.addEventListener("click", () => {

    running = !running; 
  
    if(running){
        button.style.webkitAnimation = 'pulse 1.5s infinite';
        button.style.backgroundColor = '#27ae60';

        refreshInterval = setInterval(function(){
            var refreshBtn = mainFrame.contentWindow.document.querySelector(".Refresh");
            refreshBtn.click();
        }, 20000);

    }
    else {
        clearInterval(refreshInterval);
        
        button.style.webkitAnimation = 'none';
        button.style.backgroundColor = '#c0392b';

    }
});


const addScriptToIframe = () => {
    mainFrame = document.querySelector("iframe.pageControl");
    let head = mainFrame.contentWindow.document.getElementsByTagName("head")[0];
    let script = mainFrame.contentWindow.document.createElement('script');
    script.innerText = iframeScript;
    script.type = "text/javascript"
    head.appendChild(script);
}




let iframeScript = `
function GetWCTasks() {
    return new Promise((resolve, reject) => {
        require(["jqueryui", "kendomenuex", "plugin/jChart", "ExternalPlugins/jquery.cookie", "ExternalPlugins/jquery.xml2json", "ExternalPlugins/jquery.mousewheel", "ExternalPlugins/jquery.panzoom",
                "ExternalPlugins/nicescroll", "underscore", "xmlParser"], function () {
            require([
                "AP.TWP",
                "init/externalhosting",
                "model/Enum",
                "model/DBQueryModel",
                "controller/ContextMenuController",
                "model/QueryBuilder",
                "proxy/AdminProxy",
                "proxy/WorkflowProxy",
                "controller/FilterData",
                "controller/OverviewController",
                "model/GridColumnModel",
                "controller/GridController",
                "controller/CRController",
                "model/LoginModel",
                "model/HomeModel",
                "model/LoadConfigurationModel",
                "model/TaskDetailModel",
                "controller/Helper",
                "controller/ProcessTaskController",
                "controller/ProcessViewerController",
                "controller/DelegationController",
                 "controller/ExternalAppController",
            ], function (AP) {
                let gridController = new AP.Model.GridController();
            
                let processTaskControler = new AP.Model.ProcessTaskController(gridController);
                let username = AP.Config.UserDetails.UserName;
                
                gridController.WorkflowProxy.QueryDatabase(gridController.QueryBuilder.GetTasksFromAPDBQuery("Tasks", username, true, false, false, "", null), function (MyWokListData) {
                    resolve(MyWokListData);
                });
            });
        });
    })
}`;

addScriptToIframe();


async function PaygroupReceiver(paygroups) {
    console.log(paygroups);
    mainFrame = document.querySelector("iframe.pageControl");

    for(let paygroupObj of paygroups) {
        let paygroup = paygroupObj.paygroup;
        let batch = paygroupObj.batch;

        console.log(paygroup);

        let mainFrame = document.querySelector("iframe.pageControl");

        let tasks = await mainFrame.contentWindow.GetWCTasks();
        console.log(tasks);
    
        if(typeof tasks === 'object') {
            let task;
            
            if(!Array.isArray(tasks.Table)) {
                task = tasks.Table;
            } else {
                let result = tasks.Table.filter((row) => {
                    // console.log(row.ProcInstName);
                    return row.ProcInstName.startsWith(paygroup)
                });
                console.log(result);

                if(result.length > 0) {
                    task = result[0];
                }
            }

            let WorkItemID = task?.WorkItemID;
    
            if(task?.DisplayName == "Capture Batch ID" && task?.ProcInstName.startsWith(paygroup)) {
                CaptureBatch(paygroup, batch, WorkItemID);
            }
            
            console.log(task);
            

        }
    }
    

    return "Got it!"
}



async function CaptureRelease (paygroup) {
   let mainFrame = document.querySelector("#page-builder-root iframe");
    
    let elem = mainFrame.contentWindow.document.querySelector(`td[title="${paygroup}"]`);
    let taskElement = elem.previousSibling;
    
    taskElement.click();
    
    // let takeAssignment = mainFrame.contentWindow.document.querySelector('li[data-data="Take Assignment"]');
    let takeAssignment = await WaitForElmInFrame(mainFrame, "#gridcontextmenu :nth-child(3)");

    takeAssignment.click();
    
    let dataModel = JSON.parse(taskElement.getAttribute("data-model"));
    let WorkItemID = dataModel.WorkItemID;
    
    // console.log(mainFrame, elem, taskElement, takeAssignment);
    
    
    const iframe = document.createElement("iframe");
    // iframe.style.display = "none";
    iframe.style.height = "1000px";
    iframe.src = `https://agilepoint.utcapp.com/ApplicationBuilder/eFormRender.html?WID=${WorkItemID}`;
    document.body.appendChild(iframe);

    await sleep(2000);

    let continueRadio = await WaitForElmInFrame(iframe, 'label input[type="radio"]');
    continueRadio.checked = true;
    

    let submitBtn = await WaitForElmInFrame(iframe, 'input[value="Submit"]');
    submitBtn.click();

    await sleep(3000);

    // Check for success
    let successDiv = await WaitForElmInFrame(iframe, '.submitSuccess');
    console.log(successDiv)

    if(successDiv) {
        iframe.remove();
    }
    
};

async function CaptureBatch (paygroup, batch, WorkItemID) {
    let mainFrame = document.querySelector("#page-builder-root iframe");
    // Group task tab $0.querySelector('[aria-controls="ProcessTab-12"]')
    // let groupTasks = await WaitForElmInFrame(mainFrame, '[aria-controls="ProcessTab-12"]');
    // groupTasks.click();
    
    
    const iframe = document.createElement("iframe");
    // iframe.style.display = "none";
    iframe.style.height = "1000px";
    iframe.src = `https://agilepoint.utcapp.com/ApplicationBuilder/eFormRender.html?WID=${WorkItemID}`;
    document.body.appendChild(iframe);

    await sleep(2000);


    let batchField = await WaitForElmInFrame(iframe, "#DS_Database_PayCycleProcessing_BatchID");
    batchField.value = batch;


    let continueRadio = await WaitForElmInFrame(iframe, 'label input[type="radio"]');
    continueRadio.checked = true;

    let previewForm = await WaitForElmInFrame(iframe, '#previewForm');
    // previewForm.submit();

    let submitBtn = await WaitForElmInFrame(iframe, 'input[value="Submit"]');
    //console.log(submitBtn);
    console.log('Submitting: ', paygroup, batch);
    submitBtn.click();

    await sleep(2000);

    // Check for success
    //let successDiv = await WaitForElmInFrame(iframe, '.submitSuccess');
    //let successDiv = await WaitForElmInFrame(iframe, '.submitSuccess[style*="display: block;"]');
    //console.log(successDiv);
    
    let successDiv = null;

    try {
        successDiv = await sleepUntil(() => {
            var x = iframe.contentWindow.document.querySelector('.submitSuccess');
            if (window.getComputedStyle(x).display === "block") {
                return x;
            } return false;
        }, 10000);
        // ready
    } catch {
        // timeout
    }


    if(successDiv) {
        iframe.remove();
    }
};


// waitForElm('.some-class').then((elm) => {
//     console.log('Element is ready');
//     console.log(elm.textContent);
// });

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function WaitForElmInFrame(frame, selector, ms = 5000) {
    return new Promise((resolve, reject) => {
        if (frame.contentWindow.document.querySelector(selector)) {
            return resolve(frame.contentWindow.document.querySelector(selector));
        }

        const tmOut = setTimeout(() => {

            observer.disconnect();
            clearTimeout(tmOut);
            console.log("Timeout:", selector);
            reject(undefined);
        }, ms)

        const observer = new MutationObserver(mutations => {
            if (frame.contentWindow.document.querySelector(selector)) {
                resolve(frame.contentWindow.document.querySelector(selector));
                observer.disconnect();
                clearTimeout(tmOut);
            }
        });

        observer.observe(frame.contentWindow.document.body, {
            childList: true,
            subtree: true
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleepUntil (f, timeoutMs){
    return new Promise((resolve, reject) => {
        const timeWas = new Date();
        const wait = setInterval(function() {
            const result = f();
            if (result) {
                console.log("resolved after", new Date() - timeWas, "ms");
                clearInterval(wait);
                resolve(result);
            } else if (new Date() - timeWas > timeoutMs) { // Timeout
                console.log("rejected after", new Date() - timeWas, "ms");
                clearInterval(wait);
                reject();
            }
        }, 500);
    });
}