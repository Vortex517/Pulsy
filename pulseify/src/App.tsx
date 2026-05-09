import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { PlayerProvider } from "@/hooks/use-player";
import { MainLayout } from "@/components/layout/main-layout";
import { Player } from "@/components/music/player";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Trending from "@/pages/trending";
import Search from "@/pages/search";
import Library from "@/pages/library";
import LikedSongs from "@/pages/liked";
import RecentlyPlayed from "@/pages/recent";
import PlaylistDetail from "@/pages/playlist";
import ArtistDetail from "@/pages/artist";
import AlbumDetail from "@/pages/album";
import Settings from "@/pages/settings";
import Premium from "@/pages/premium";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NowPlaying from "@/pages/now-playing";

const queryClient = new QueryClient();

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/trending" component={Trending} />
        <Route path="/search" component={Search} />
        <Route path="/library" component={Library} />
        <Route path="/liked" component={LikedSongs} />
        <Route path="/recent" component={RecentlyPlayed} />
        <Route path="/now-playing" component={NowPlaying} />
        <Route path="/playlist/:id" component={PlaylistDetail} />
        <Route path="/artist/:id" component={ArtistDetail} />
        <Route path="/album/:id" component={AlbumDetail} />
        <Route path="/settings" component={Settings} />
        <Route path="/premium" component={Premium} />
        <Route path="/profile" component={Profile} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
      <Player />
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
