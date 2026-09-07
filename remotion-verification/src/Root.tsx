import "./index.css";
import { GoogleVerificationDemo, GOOGLE_VERIFICATION_DURATION, GOOGLE_VERIFICATION_FPS } from "./GoogleVerification";
import { GoogleVerificationV2, GOOGLE_V2_DURATION, GOOGLE_V2_FPS } from "./GoogleVerificationV2";
import { Composition } from "remotion";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GoogleVerificationDemo"
        component={GoogleVerificationDemo}
        durationInFrames={GOOGLE_VERIFICATION_DURATION}
        fps={GOOGLE_VERIFICATION_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="GoogleVerificationV2"
        component={GoogleVerificationV2}
        durationInFrames={GOOGLE_V2_DURATION}
        fps={GOOGLE_V2_FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
