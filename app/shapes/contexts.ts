/*
This would normally be in a metadata database.
 */

interface ContextI {
    name:string;
    domain?: string;
    displayName?:string;
    mongoDatabase:string;
    emailList?:{
        toAddresses:string[]
    }
}

class Context implements ContextI{
    name:string;
    domain?: string;
    displayName?:string;
    mongoDatabase:string;
    emailList?:{
        toAddresses:string[]
    }
}

export {ContextI, Context};

