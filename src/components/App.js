import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "../context/user-context";
import Header from "./Header";
import Home from "./Home";

const Snippets = lazy(() => import("./Snippets"));
const RecentSnippets = lazy(() => import("./RecentSnippets"));
const LocalSnippets = lazy(() => import("./LocalSnippets"));
const View = lazy(() => import("./View"));
const Form = lazy(() => import("./Form"));
const Search = lazy(() => import("./Search"));
const UserForms = lazy(() => import("./UserForms"));
const UserSettings = lazy(() => import("./UserSettings"));
const NoMatch = lazy(() => import("./NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Header/>
        <main>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/snippets" element={<LocalSnippets/>} key="local"/>
              <Route path="/snippets/create" element={<Form/>} key="create"/>
              <Route path="/snippets/recent" element={<RecentSnippets/>}/>
              <Route path="/snippets/:id" element={<View/>}/>
              <Route path="/snippets/:id/edit" element={<Form/>} key="edit"/>
              <Route path="/users/:username" element={<Snippets/>}/>
              <Route path="/users/:username/:snippetId" element={<View/>}/>
              <Route path="/users/:username/:snippetId/edit" element={<Form/>} key="remote"/>
              <Route path="/search" element={<Search/>}/>
              <Route path="/login" element={<UserForms/>} key="login"/>
              <Route path="/register" element={<UserForms/>} key="register"/>
              <Route path="/settings" element={<UserSettings/>}/>
              <Route path="*" element={<NoMatch/>}/>
            </Routes>
          </Suspense>
        </main>
      </UserProvider>
    </HashRouter>
  );
}
