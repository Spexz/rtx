/**
 * Example usage:
 * const hotspots = findAllDeep(element, `[slot*="hotspot"]`, 10);
 */
const findAllDeep = (parent, selectors, depth = null) => {
  let nodes = new Set();
  let currentDepth = 1;
  const recordResult = (nodesArray) => {
    for (const node of nodesArray) {
      nodes.add(node)
    }
  }
  const recursiveSeek = _parent => {
    // check for selectors in lightdom
    recordResult(_parent.querySelectorAll(selectors));
    if (_parent.shadowRoot) {
      // check for selectors in shadowRoot
      recordResult(_parent.shadowRoot.querySelectorAll(selectors));
      // look for nested components with shadowRoots
      for (let child of [..._parent.shadowRoot.querySelectorAll('*')].filter(i => i.shadowRoot)) {
        // make sure we haven't hit our depth limit
        if (depth === null || currentDepth < depth) {
          recursiveSeek(child);
        }
      }
    }
  };
  recursiveSeek(parent);
  return nodes;
};


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

async function ClearStorage() {
    
   let result = await new Promise(async  (resolve, reject) => {
      let btn = await sleepUntil(() => {
         let csbtns = findAllDeep(document.querySelector("settings-ui"), "#clearStorage"); 
      
         if (csbtns.size > 0) {
            return [...csbtns.values()][0];
         }
         else return false;
      }, 3000);
      
      console.log(btn);
      btn.click()
      
      let dialog = await sleepUntil(() => {
         let results = findAllDeep(document.querySelector("settings-ui"), "#confirmClearStorage"); 
         if (results.size > 0) 
            return [...results.values()][0];
         else 
            return false;
      }, 3000);
      
      let abtn = await sleepUntil(() => {
         let results = findAllDeep(dialog, ".action-button"); 
         if (results.size > 0) 
            return [...results.values()][0];
         else 
            return false;
      }, 3000);
      
      console.log(abtn);
      abtn.click()

      resolve("Done");
   });
   return result;
}
