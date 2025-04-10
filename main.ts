//run with yarn start
// Paste your API key here
const apiKey = ""

const headers = {Authorization: "Bearer " + apiKey, "Content-Type": "application/json"}

import ReadLine from "node:readline"
const rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout
})
async function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(`${question}\n`, (answer) => {
            resolve(answer)
        })
    })
}

async function ding(): Promise<void> {
    return new Promise((resolve) => {
        process.stdout.write("\u0007")
        setTimeout(() => resolve(), 1000)
    })
}

async function go() {
    const date = (new Date()).toLocaleDateString('en-US')
    //START SANDBOX
    let NameArr: string[] = []
    let input: string = ""
    let didError = false
    console.log("(type done to exit)")

    try {
        while (true) {
            ding()
            input = await askQuestion("Lookup:")
            if(input == "done") break;
            const r = fetch("https://erau.teamdynamix.com/TDWebApi/api/29/assets/search", {headers: headers, method: "POST", body: JSON.stringify({
                SerialLike: input
            })})
            const assetID = (await (await r).json())[0].ID
            const r2 = fetch(`https://erau.teamdynamix.com/TDWebApi/api/29/assets/${assetID}`, {headers: headers})
            let asset = await (await r2).json()
            
            //Log name for AD deletion
            let name = asset.Name
            console.log(`\nName: ${name} ID: ${asset.ID} Serial: ${asset.SerialNumber}\n`)
            
            //Wipe name
            asset.Name = ""
    
            
            
            //70a 101
            asset.LocationID = 113
            asset.LocationRoomID = 4196
    
            //Surplus
            asset.StatusID = 11;
    
            //Justification to none
            asset.Attributes = (asset.Attributes as any[]).filter(attribute  => {
                if(attribute.ID != 1726) return true;
                return false;
            })
    
            //Owning account
            asset.OwningCustomerID = "00000000-0000-0000-0000-000000000000"
            asset.OwningDepartmentID = 1912
    
            //Custom properties
            for (let i = 0; i < asset.Attributes.length; i++) {
                const element = asset.Attributes[i];
                //Last inventoried
                if(element.ID == 2259) {
                    element.Value = date
                }
                //end
                asset.Attributes[i] = element;
            }
            
            
            const r3 = await fetch(`https://erau.teamdynamix.com/TDWebApi/api/29/assets/${asset.ID}`, {method: "POST", headers: headers, body: JSON.stringify(asset)})
            //if no error, log as sucessful
            NameArr.push(name)
        }

    } catch (error) {        
        didError = true
        console.log(error)
        console.log("\n\n==NOTE==\n Any text outside the ERROR and SURPLUS blocks was not processed and must be scanned again.\nERROR items may have been partially processed and should be checked in TDX\n\n")
        console.log("\n\n----ERROR----\n")
        console.log(input)
        console.log("\n-------------\n\n")
    } finally {
        console.log("\n\n---SURPLUS---\n")
        NameArr.forEach(name => console.log(name))
        console.log("\n-------------\n\n")

        if(didError) {
            await ding()
            await ding()
        }
    }
}

go().then(() => {
    rl.close()
    process.exit(0)
})