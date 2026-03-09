import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import CreateStory from "./pages/CreateStory";
import Library from "./pages/Library";
import Content from "./pages/Content";
import { Progress } from "./pages/Progress";
import BatchUpload from "./pages/BatchUpload";
import EnrollStudents from "./pages/EnrollStudents";
import TeacherDashboard from "./pages/TeacherDashboard";
import ClassDetail from "./pages/ClassDetail";
import ClassAnalytics from "./pages/ClassAnalytics";
import Gamification from "./pages/Gamification";
import Wordbank from "./pages/Wordbank";
import SRSStats from "./pages/SRSStats";
import ReviewMode from "./pages/ReviewMode";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { SubscriptionSettings } from "./pages/SubscriptionSettings";
import { AffiliateAnalytics } from "./pages/AffiliateAnalytics";
import Collections from "./pages/Collections";
import CollectionView from "./pages/CollectionView";
import PublicCollectionView from "./pages/PublicCollectionView";
import { CreatorDashboard } from "./pages/CreatorDashboard";
import { Leaderboard } from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Notifications from "./pages/Notifications";
import LevelTest from "./pages/LevelTest";
import TonePractice from "./pages/TonePractice";
import ToneMasteryDashboard from "./pages/ToneMasteryDashboard";
import TonePairDrills from "./pages/TonePairDrills";
import WatchHistory from "./pages/WatchHistory";
import VocabBrowse from "./pages/VocabBrowse";
import VocabDetail from "./pages/VocabDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Digests from "./pages/Digests";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Careers from "./pages/Careers";
import CookiePolicy from "./pages/CookiePolicy";
import Referrals from "./pages/Referrals";
import Affiliates from "./pages/Affiliates";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import AffiliateApplication from "./pages/AffiliateApplication";
import AffiliateResources from "./pages/AffiliateResources";
import AffiliateOnboarding from "./pages/AffiliateOnboarding";
import PayoutManagement from "./pages/PayoutManagement";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import HelpTutorials from "./pages/HelpTutorials";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Landing} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/login"} component={Login} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/contact"} component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/careers" component={Careers} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path={"/affiliates"} component={Affiliates} />
      <Route path={"/shared/:token"} component={PublicCollectionView} />
      <Route path={"/help"} component={HelpTutorials} />

      {/* Protected routes */}
      <Route path={"/app"}>{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path={"/dashboard"}>{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path={"/create"}>{() => <ProtectedRoute component={CreateStory} />}</Route>
      <Route path={"/library"}>{() => <ProtectedRoute component={Library} />}</Route>
      <Route path={"/history"}>{() => <ProtectedRoute component={WatchHistory} />}</Route>
      <Route path="/vocab/browse">{() => <ProtectedRoute component={VocabBrowse} />}</Route>
      <Route path="/vocab/:slug">{() => <ProtectedRoute component={VocabDetail} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} />}</Route>
      <Route path="/digests">{() => <ProtectedRoute component={Digests} />}</Route>
      <Route path="/referrals">{() => <ProtectedRoute component={Referrals} />}</Route>
      <Route path={"/affiliate-onboarding"}>{() => <ProtectedRoute component={AffiliateOnboarding} />}</Route>
      <Route path={"/affiliate-application"}>{() => <ProtectedRoute component={AffiliateApplication} />}</Route>
      <Route path={"/affiliate-resources"}>{() => <ProtectedRoute component={AffiliateResources} />}</Route>
      <Route path={"/payout-management"}>{() => <ProtectedRoute component={PayoutManagement} />}</Route>
      <Route path={"/affiliate-dashboard"}>{() => <ProtectedRoute component={AffiliateDashboard} />}</Route>
      <Route path={"/collections"}>{() => <ProtectedRoute component={Collections} />}</Route>
      <Route path={"/collection/:id"}>{() => <ProtectedRoute component={CollectionView} />}</Route>
      <Route path={"/creator-dashboard"}>{() => <ProtectedRoute component={CreatorDashboard} />}</Route>
      <Route path={"/leaderboard"}>{() => <ProtectedRoute component={Leaderboard} />}</Route>
      <Route path={"/profile/:userId"}>{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path={"/discover"}>{() => <ProtectedRoute component={Discover} />}</Route>
      <Route path={"/notifications"}>{() => <ProtectedRoute component={Notifications} />}</Route>
      <Route path="/level-test">{() => <ProtectedRoute component={LevelTest} />}</Route>
      <Route path="/tone-practice">{() => <ProtectedRoute component={TonePractice} />}</Route>
      <Route path="/tone-mastery">{() => <ProtectedRoute component={ToneMasteryDashboard} />}</Route>
      <Route path="/tone-pair-drills">{() => <ProtectedRoute component={TonePairDrills} />}</Route>
      <Route path={"/content/:id"}>{() => <ProtectedRoute component={Content} />}</Route>
      <Route path={"/progress"}>{() => <ProtectedRoute component={Progress} />}</Route>
      <Route path={"/gamification"}>{() => <ProtectedRoute component={Gamification} />}</Route>
      <Route path={"/wordbank"}>{() => <ProtectedRoute component={Wordbank} />}</Route>
      <Route path={"/srs-stats"}>{() => <ProtectedRoute component={SRSStats} />}</Route>
      <Route path="/review-mode">{() => <ProtectedRoute component={ReviewMode} />}</Route>
      <Route path="/review">{() => <ProtectedRoute component={Review} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/settings/subscription">{() => <ProtectedRoute component={SubscriptionSettings} />}</Route>
      <Route path="/affiliate/analytics">{() => <ProtectedRoute component={AffiliateAnalytics} />}</Route>
      <Route path={"/batch"}>{() => <ProtectedRoute component={BatchUpload} />}</Route>
      <Route path={"/teacher"}>{() => <ProtectedRoute component={TeacherDashboard} />}</Route>
      <Route path={"/teacher/class/:id"}>{() => <ProtectedRoute component={ClassDetail} />}</Route>
      <Route path={"/teacher/class/:id/analytics"}>{() => <ProtectedRoute component={ClassAnalytics} />}</Route>
      <Route path={"/teacher/class/:classId/enroll"}>{() => <ProtectedRoute component={EnrollStudents} />}</Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

const AUTH_ROUTES = ["/login", "/signup"];

function AppShell() {
  const [location] = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location);

  return (
    <>
      <Router />
      {!isAuthPage && <Footer />}
      <CookieConsent />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppShell />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
