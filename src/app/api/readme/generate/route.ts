import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStore } from "@/lib/store";
import { buildProfileModel } from "@/lib/profile/profile-model";
import { composeReadme, profileModelToReadmeInput } from "@/lib/readme/compose-readme";
import { defaultQuestionnaire } from "@/lib/profile/questionnaire";
import { generateAsset } from "@/lib/assets/generate-asset";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getUserStore(session.user.email);

  if (!store.importData) {
    return NextResponse.json(
      { error: "No GitHub data imported yet. Please complete onboarding first." },
      { status: 400 },
    );
  }

  const narrative = store.questionnaire ?? {
    ...defaultQuestionnaire(),
    bio: store.importData.profile.bio ?? "Developer",
    goals: "Showcase my work",
    archetype: "",
  };

  const featuredIds = store.featuredProjectIds ?? [];

  const profileModel = buildProfileModel({
    profile: store.importData.profile,
    repositories: store.importData.repositories,
    narrative,
    featuredProjectIds: featuredIds,
  });

  // Generate asset cards
  const [activityCard, languageCard] = await Promise.all([
    generateAsset({
      kind: "activity-card",
      data: {
        login: profileModel.login,
        totalRepos: profileModel.totalRepos,
        totalStars: profileModel.totalStars,
        recentlyActiveRepos: profileModel.recentlyActiveRepos,
      },
    }),
    generateAsset({
      kind: "language-card",
      data: {
        login: profileModel.login,
        languages: profileModel.languages,
      },
    }),
  ]);

  const readmeInput = profileModelToReadmeInput(profileModel);

  // Embed SVG assets as data URIs for preview (in production these would be hosted URLs)
  readmeInput.assets = [
    {
      alt: "Activity overview",
      url: `data:image/svg+xml;base64,${Buffer.from(activityCard.content).toString("base64")}`,
    },
    {
      alt: "Language breakdown",
      url: `data:image/svg+xml;base64,${Buffer.from(languageCard.content).toString("base64")}`,
    },
  ];

  const markdown = composeReadme(readmeInput);

  return NextResponse.json({
    success: true,
    markdown,
    profileModel,
  });
}
