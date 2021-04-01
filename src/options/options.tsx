import * as React from "react";
import * as ReactDOM from "react-dom";

import {Options} from "./App";
import "../../options/style.less";

let mountNode = document.getElementById("app-root");
ReactDOM.render(<Options />, mountNode);
