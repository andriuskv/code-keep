import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Snippets from "./Snippets";
import View from "./View";
import Form from "./Form";

export default function App() {
  return (
    <HashRouter>
      <Header />
      <main>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/snippets" exact component={Snippets} />
          <Route path="/snippets/create" component={Form} key="create" />
          <Route path="/snippets/:id" exact component={View} />
          <Route path="/snippets/:id/edit" component={Form} key="edit" />
        </Switch>
      </main>
    </HashRouter>
  );
}
