import * as React from "react";
import StorageManagerObject from "../js/storageManagerObject";
import {AddForm} from "./components/AddForm";
import {DomainsList} from "./components/DomainsList";

export const Options = () => {
    const storage = new StorageManagerObject();
    storage.set({options_shown: true});


    return (
        <>
            <AddForm/>
            <DomainsList/>
        </>
    );
};
