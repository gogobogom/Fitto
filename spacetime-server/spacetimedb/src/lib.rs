use spacetimedb::{table, reducer, ReducerContext, Identity, Table, Timestamp, SpacetimeType, TimeDuration};
use std::time::Duration;

// Custom shared types

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum Gender {
    Male,
    Female,
    Other,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum ActivityLevel {
    Sedentary,
    LightlyActive,
    ModeratelyActive,
    VeryActive,
    ExtraActive,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum GoalType {
    Lose,
    Gain,
    Maintain,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum MealType {
    Breakfast,
    Lunch,
    Dinner,
    Snack,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub struct Date {
    pub year: i32,
    pub month: u32,
    pub day: u32,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub struct RecipeIngredient {
    pub food_id: u64,
    pub grams: f32,
}

// New shared types for wellness features

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub struct TimeOfDay {
    pub hour: u8,   // 0..=23
    pub minute: u8, // 0..=59
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum HabitFrequency {
    Daily,
    Weekly,
}

// New shared types for subscription management

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum PlanType {
    Free,
    Monthly,
    Quarterly,
    Yearly,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum SubscriptionStatus {
    Active,
    Paused,
    Canceled,
    Expired,
}

// Admin shared types

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum AdminRole {
    SuperAdmin,
    Admin,
    Moderator,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum AdminStatus {
    Active,
    Suspended,
    Disabled,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum AdminActionType {
    Login,
    Logout,
    CreateAdmin,
    UpdateAdmin,
    DeleteAdmin,
    ChangeRole,
    ChangeStatus,
    AuditRead,
    Other,
}

// Additional shared types for platform management & monitoring

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum AnnouncementLevel {
    Info,
    Warning,
    Critical,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum BugStatus {
    Open,
    Triaged,
    InProgress,
    Resolved,
    Closed,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum SecurityEventType {
    LoginSuccess,
    LoginFailure,
    AccountLock,
    PermissionDenied,
    RateLimitTriggered,
    IPBlocked,
    DataExport,
    ConfigChange,
    Other,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum RateLimitScope {
    Identity,
    IP,
    Global,
    Endpoint,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum AuthType {
    None,
    ApiKeyHeader,
    ApiKeyQuery,
    OAuth2ClientCredentials,
}

// Tables

#[table(name = user_profile, public)]
#[derive(Clone)]
pub struct UserProfile {
    #[primary_key]
    identity: Identity,
    username: String,
    age: i32,
    weight_kg: f32,
    height_cm: f32,
    gender: Gender,
    activity_level: ActivityLevel,
    created_at: Timestamp,
}

#[table(name = user_goals, public)]
#[derive(Clone)]
pub struct UserGoals {
    #[primary_key]
    identity: Identity,
    goal_type: GoalType,
    target_weight_kg: f32,
    daily_calorie_target: i32,
    protein_target_g: f32,
    carb_target_g: f32,
    fat_target_g: f32,
    created_at: Timestamp,
    updated_at: Timestamp,
}

#[table(
    name = food_item,
    public,
    index(name = food_name_idx, btree(columns = [name])),
    index(name = food_creator_idx, btree(columns = [created_by_identity]))
)]
#[derive(Clone)]
pub struct FoodItem {
    #[primary_key]
    #[auto_inc]
    id: u64,
    name: String,
    name_tr: String,
    calories_per_100g: f32,
    protein_per_100g: f32,
    carbs_per_100g: f32,
    fat_per_100g: f32,
    fiber_per_100g: f32,
    category: String,
    is_custom: bool,
    created_by_identity: Identity,
}

#[table(
    name = daily_log,
    public,
    index(name = daily_log_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct DailyLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    food_id: u64,
    meal_type: MealType,
    portion_grams: f32,
    date: Date,
    timestamp: Timestamp,
}

#[table(
    name = exercise_log,
    public,
    index(name = exercise_log_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct ExerciseLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    exercise_name: String,
    duration_minutes: f32,
    calories_burned: f32,
    date: Date,
    timestamp: Timestamp,
}

#[table(
    name = recipe,
    public,
    index(name = recipe_user_idx, btree(columns = [user_identity]))
)]
#[derive(Clone)]
pub struct Recipe {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    name: String,
    description: String,
    total_calories: f32,
    total_protein: f32,
    total_carbs: f32,
    total_fat: f32,
    servings: u32,
    ingredients: Vec<RecipeIngredient>,
    created_at: Timestamp,
}

// Computed summaries (for get_daily_summary reducer results)
#[table(
    name = daily_summary,
    public,
    index(name = summary_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct DailySummary {
    #[primary_key]
    summary_id: String, // user_identity + date string
    user_identity: Identity,
    date: Date,
    total_calories: f32,
    total_protein: f32,
    total_carbs: f32,
    total_fat: f32,
    exercise_calories: f32,
    net_calories: f32,
    generated_at: Timestamp,
}

// Phase 8 - New Tables

#[table(
    name = body_measurement,
    public,
    index(name = bm_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct BodyMeasurement {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    date: Date,
    weight_kg: f32,
    waist_cm: f32,
    hip_cm: f32,
    chest_cm: f32,
    arm_cm: f32,
    thigh_cm: f32,
    body_fat_percentage: Option<f32>,
    notes: Option<String>,
}

#[table(
    name = progress_photo,
    public,
    index(name = pp_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct ProgressPhoto {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    date: Date,
    photo_url: String,
    notes: Option<String>,
    measurements_snapshot: Option<String>,
}

#[table(
    name = favorite_food,
    public,
    index(name = fav_user_food_idx, btree(columns = [user_identity, food_id]))
)]
#[derive(Clone)]
pub struct FavoriteFood {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    food_id: String,
    food_name: String,
    calories: f32,
    protein: f32,
    carbs: f32,
    fat: f32,
    typical_serving_size: String,
    date_added: Timestamp,
}

#[table(
    name = favorite_food_status,
    public,
    index(name = fav_status_user_food_idx, btree(columns = [user_identity, food_id]))
)]
#[derive(Clone)]
pub struct FavoriteFoodStatus {
    #[primary_key]
    status_id: String, // format: "{identity}:{food_id}"
    user_identity: Identity,
    food_id: String,
    is_favorited: bool,
    checked_at: Timestamp,
}

// New Wellness Feature Tables

// Mood and Energy Tracking
#[table(
    name = mood_entry,
    public,
    index(name = mood_user_date_idx, btree(columns = [user_identity, date]))
)]
#[derive(Clone)]
pub struct MoodEntry {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    date: Date,
    mood_score: u8,   // 1..=5
    energy_score: u8, // 1..=5
    notes: Option<String>,
    timestamp: Timestamp,
}

#[table(
    name = mood_trend_summary,
    public,
    index(name = mood_trend_user_idx, btree(columns = [user_identity]))
)]
#[derive(Clone)]
pub struct MoodTrendSummary {
    #[primary_key]
    summary_id: String, // "{user}:{yyyy-mm-dd}:{yyyy-mm-dd}"
    user_identity: Identity,
    start_date: Date,
    end_date: Date,
    entry_count: u32,
    avg_mood: f32,
    avg_energy: f32,
    generated_at: Timestamp,
}

// Supplement Tracking
#[table(
    name = supplement,
    public,
    index(name = supplement_user_name_idx, btree(columns = [user_identity, name]))
)]
#[derive(Clone)]
pub struct Supplement {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    name: String,
    dosage: String,      // e.g., "500mg", "2 capsules"
    time_of_day: TimeOfDay,
    is_active: bool,
    created_at: Timestamp,
}

#[table(
    name = supplement_log,
    public,
    index(name = sup_log_user_sup_date_idx, btree(columns = [user_identity, supplement_id, date]))
)]
#[derive(Clone)]
pub struct SupplementLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    supplement_id: u64,
    date: Date,
    taken: bool,
    timestamp: Timestamp,
}

#[table(
    name = supplement_completion_summary,
    public,
    index(name = sup_comp_user_sup_idx, btree(columns = [user_identity, supplement_id]))
)]
#[derive(Clone)]
pub struct SupplementCompletionSummary {
    #[primary_key]
    summary_id: String, // "{user}:{supplement_id}:{start}-{end}"
    user_identity: Identity,
    supplement_id: u64,
    start_date: Date,
    end_date: Date,
    scheduled_days: u32,
    taken_days: u32,
    completion_rate: f32,
    generated_at: Timestamp,
}

// Habit Tracking
#[table(
    name = habit,
    public,
    index(name = habit_user_name_idx, btree(columns = [user_identity, name]))
)]
#[derive(Clone)]
pub struct Habit {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    name: String,
    frequency: HabitFrequency, // Daily or Weekly
    target_value: f32,         // target per period
    unit: String,              // e.g., "times", "minutes", "L"
    icon: String,
    color: String,
    is_active: bool,
    created_at: Timestamp,
}

#[table(
    name = habit_log,
    public,
    index(name = habit_log_user_habit_date_idx, btree(columns = [user_identity, habit_id, date]))
)]
#[derive(Clone)]
pub struct HabitLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    user_identity: Identity,
    habit_id: u64,
    date: Date,
    value: f32,       // amount completed on this date
    is_complete: bool, // for Daily: value >= target; for Weekly: per-day completion marker (aggregate used)
    timestamp: Timestamp,
}

#[table(
    name = habit_streak_status,
    public,
    index(name = habit_streak_user_idx, btree(columns = [user_identity]))
)]
#[derive(Clone)]
pub struct HabitStreakStatus {
    #[primary_key]
    habit_id: u64, // one row per habit
    user_identity: Identity,
    frequency: HabitFrequency,
    current_streak: u32,
    best_streak: u32,
    last_completed_date: Option<Date>, // used for Daily
    last_counted_week_id: Option<String>, // used for Weekly; week id based on Monday ordinal
    updated_at: Timestamp,
}

// Subscription Management Table

#[table(name = subscription, public)]
#[derive(Clone)]
pub struct Subscription {
    #[primary_key]
    identity: Identity,
    plan_type: PlanType,
    status: SubscriptionStatus,
    start_date: Date,
    end_date: Option<Date>, // None for Free
    created_at: Timestamp,
    updated_at: Timestamp,
}

// AI Nutrition Coach - New Tables

#[table(name = trial_status, public)]
#[derive(Clone)]
pub struct TrialStatus {
    #[primary_key]
    identity: Identity,
    start_date: Date,
    end_date: Date,
    daily_message_limit: u32, // should be 10
    messages_used_today: u32,
    is_active: bool,
    last_reset_date: Date,
}

#[table(name = ad_credit, public)]
#[derive(Clone)]
pub struct AdCredit {
    #[primary_key]
    identity: Identity,
    credits_remaining: u32,
    last_ad_watched: u64, // micros since epoch
}

#[table(name = ai_message, public)]
#[derive(Clone)]
pub struct AIMessage {
    #[primary_key]
    #[auto_inc]
    id: u64,
    identity: Identity,
    message: String,
    response: String,
    timestamp: u64, // micros since epoch
}

// Admin System Tables

#[table(
    name = admin_user,
    public,
    index(name = admin_user_email_idx, btree(columns = [email])),
    index(name = admin_user_role_idx, btree(columns = [role])),
    index(name = admin_user_status_idx, btree(columns = [status]))
)]
#[derive(Clone)]
pub struct AdminUser {
    #[primary_key]
    identity: Identity, // SpacetimeDB authentication identity
    email: String,
    role: AdminRole,
    status: AdminStatus,
    created_at: Timestamp,
    last_login: Option<Timestamp>,
}

#[table(
    name = admin_session,
    public,
    index(name = admin_session_admin_idx, btree(columns = [admin_identity])),
    index(name = admin_session_expires_idx, btree(columns = [expires_at])),
    index(name = admin_session_created_idx, btree(columns = [created_at]))
)]
#[derive(Clone)]
pub struct AdminSession {
    #[primary_key]
    session_id: String, // unique session id
    admin_identity: Identity,
    ip_address: String,
    created_at: Timestamp,
    expires_at: Timestamp,
}

#[table(
    name = admin_audit_log,
    public,
    index(name = admin_audit_admin_time_idx, btree(columns = [admin_identity, timestamp])),
    index(name = admin_audit_time_idx, btree(columns = [timestamp]))
)]
#[derive(Clone)]
pub struct AdminAuditLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    admin_identity: Identity,
    action_type: AdminActionType,
    target_user: Option<Identity>,
    details: String,
    timestamp: Timestamp,
}

// Platform Management Tables

#[table(
    name = maintenance_mode,
    public,
    index(name = maintenance_active_idx, btree(columns = [active]))
)]
#[derive(Clone)]
pub struct MaintenanceMode {
    #[primary_key]
    id: u8, // singleton row (use id=1)
    active: bool,
    message: String,
    enabled_by: Option<Identity>,
    updated_at: Timestamp,
    scheduled_end: Option<Timestamp>,
}

#[table(
    name = feature_flag,
    public,
    index(name = feature_flag_enabled_idx, btree(columns = [enabled])),
    index(name = feature_flag_updated_idx, btree(columns = [updated_at]))
)]
#[derive(Clone)]
pub struct FeatureFlag {
    #[primary_key]
    name: String,
    enabled: bool,
    rollout_pct: u8, // 0..=100
    description: String,
    updated_by: Identity,
    updated_at: Timestamp,
}

#[table(
    name = announcement,
    public,
    index(name = announcement_level_idx, btree(columns = [level])),
    index(name = announcement_start_idx, btree(columns = [starts_at])),
    index(name = announcement_end_idx, btree(columns = [ends_at]))
)]
#[derive(Clone)]
pub struct Announcement {
    #[primary_key]
    #[auto_inc]
    id: u64,
    title: String,
    body: String,
    level: AnnouncementLevel,
    starts_at: Option<Timestamp>,
    ends_at: Option<Timestamp>,
    created_by: Identity,
    created_at: Timestamp,
}

#[table(
    name = notification_template,
    public,
    index(name = notif_template_active_idx, btree(columns = [is_active]))
)]
#[derive(Clone)]
pub struct NotificationTemplate {
    #[primary_key]
    template_name: String,
    subject: String,
    body: String,
    channels: Vec<String>, // e.g., ["email","push"]
    is_active: bool,
    updated_by: Identity,
    updated_at: Timestamp,
}

// Monitoring Tables

#[table(
    name = bug_report,
    public,
    index(name = bug_status_idx, btree(columns = [status])),
    index(name = bug_severity_idx, btree(columns = [severity])),
    index(name = bug_time_idx, btree(columns = [created_at]))
)]
#[derive(Clone)]
pub struct BugReport {
    #[primary_key]
    #[auto_inc]
    id: u64,
    reporter: Option<Identity>,
    title: String,
    description: String,
    severity: Severity,
    status: BugStatus,
    created_at: Timestamp,
    triaged_by: Option<Identity>,
    triaged_at: Option<Timestamp>,
}

#[table(
    name = error_log,
    public,
    index(name = error_severity_idx, btree(columns = [severity])),
    index(name = error_time_idx, btree(columns = [timestamp])),
    index(name = error_source_idx, btree(columns = [source]))
)]
#[derive(Clone)]
pub struct ErrorLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    source: String, // subsystem/module
    message: String,
    stack_trace: Option<String>,
    severity: Severity,
    environment: String, // e.g., "prod","staging"
    timestamp: Timestamp,
}

#[table(
    name = security_event,
    public,
    index(name = sec_event_type_time_idx, btree(columns = [event_type, timestamp])),
    index(name = sec_event_ip_idx, btree(columns = [ip_address]))
)]
#[derive(Clone)]
pub struct SecurityEvent {
    #[primary_key]
    #[auto_inc]
    id: u64,
    event_type: SecurityEventType,
    actor_identity: Option<Identity>,
    ip_address: String,
    user_agent: Option<String>,
    details: String,
    timestamp: Timestamp,
}

// Security Tables

#[table(
    name = blocked_ip,
    public,
    index(name = blocked_ip_active_idx, btree(columns = [is_active])),
    index(name = blocked_ip_expires_idx, btree(columns = [expires_at]))
)]
#[derive(Clone)]
pub struct BlockedIP {
    #[primary_key]
    ip_address: String,
    reason: String,
    blocked_by: Identity,
    blocked_at: Timestamp,
    expires_at: Option<Timestamp>,
    is_active: bool,
}

#[table(
    name = rate_limit_config,
    public,
    index(name = rate_limit_scope_idx, btree(columns = [scope])),
    index(name = rate_limit_endpoint_idx, btree(columns = [endpoint_pattern]))
)]
#[derive(Clone)]
pub struct RateLimitConfig {
    #[primary_key]
    name: String, // unique config name
    scope: RateLimitScope,
    endpoint_pattern: String, // e.g., "/api/v1/*"
    limit_per_minute: u32,
    burst: u32,
    enabled: bool,
    updated_by: Identity,
    updated_at: Timestamp,
}

// API Management Tables

#[table(
    name = external_api,
    public,
    index(name = external_api_enabled_idx, btree(columns = [enabled]))
)]
#[derive(Clone)]
pub struct ExternalAPI {
    #[primary_key]
    api_name: String,
    base_url: String,
    enabled: bool,
    quota_per_day: Option<u32>,
    auth_type: AuthType,
    key_id: Option<String>, // reference to secret manager id
    created_at: Timestamp,
    updated_at: Timestamp,
    updated_by: Identity,
}

#[table(
    name = api_usage_log,
    public,
    index(name = api_usage_api_time_idx, btree(columns = [api_name, timestamp])),
    index(name = api_usage_ok_idx, btree(columns = [ok])),
    index(name = api_usage_status_idx, btree(columns = [status_code]))
)]
#[derive(Clone)]
pub struct APIUsageLog {
    #[primary_key]
    #[auto_inc]
    id: u64,
    api_name: String,
    identity: Option<Identity>,
    endpoint: String,
    status_code: u16,
    latency_ms: u32,
    ok: bool,
    error_message: Option<String>,
    timestamp: Timestamp,
}

// System Metrics

#[table(
    name = system_metric,
    public,
    index(name = metric_name_time_idx, btree(columns = [metric_name, timestamp]))
)]
#[derive(Clone)]
pub struct SystemMetric {
    #[primary_key]
    #[auto_inc]
    id: u64,
    metric_name: String,
    value: f64,
    labels: Vec<String>, // ["env=prod","region=us-east"]
    timestamp: Timestamp,
}

// Reducers

#[reducer]
pub fn create_or_update_user_profile(
    ctx: &ReducerContext,
    username: String,
    age: i32,
    weight_kg: f32,
    height_cm: f32,
    gender: Gender,
    activity_level: ActivityLevel,
) -> Result<(), String> {
    if username.trim().is_empty() {
        return Err("Username cannot be empty".into());
    }
    if age <= 0 {
        return Err("Age must be positive".into());
    }
    if weight_kg <= 0.0 || height_cm <= 0.0 {
        return Err("Weight and height must be positive".into());
    }

    let identity = ctx.sender;
    if let Some(mut profile) = ctx.db.user_profile().identity().find(&identity) {
        profile.username = username.clone();
        profile.age = age;
        profile.weight_kg = weight_kg;
        profile.height_cm = height_cm;
        profile.gender = gender.clone();
        profile.activity_level = activity_level.clone();
        ctx.db.user_profile().identity().update(profile);
        spacetimedb::log::info!("Updated profile for {}", identity);
    } else {
        let new_profile = UserProfile {
            identity,
            username: username.clone(),
            age,
            weight_kg,
            height_cm,
            gender: gender.clone(),
            activity_level: activity_level.clone(),
            created_at: ctx.timestamp,
        };
        match ctx.db.user_profile().try_insert(new_profile) {
            Ok(_) => spacetimedb::log::info!("Created profile for {}", identity),
            Err(e) => {
                let msg = format!("Failed to create profile: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn set_user_goals(
    ctx: &ReducerContext,
    goal_type: GoalType,
    target_weight_kg: f32,
    daily_calorie_target: i32,
    protein_target_g: f32,
    carb_target_g: f32,
    fat_target_g: f32,
) -> Result<(), String> {
    if target_weight_kg <= 0.0 {
        return Err("Target weight must be positive".into());
    }
    if daily_calorie_target <= 0 {
        return Err("Daily calorie target must be positive".into());
    }
    if protein_target_g < 0.0 || carb_target_g < 0.0 || fat_target_g < 0.0 {
        return Err("Macro targets cannot be negative".into());
    }

    let identity = ctx.sender;
    if let Some(mut goals) = ctx.db.user_goals().identity().find(&identity) {
        goals.goal_type = goal_type.clone();
        goals.target_weight_kg = target_weight_kg;
        goals.daily_calorie_target = daily_calorie_target;
        goals.protein_target_g = protein_target_g;
        goals.carb_target_g = carb_target_g;
        goals.fat_target_g = fat_target_g;
        goals.updated_at = ctx.timestamp;
        ctx.db.user_goals().identity().update(goals);
        spacetimedb::log::info!("Updated goals for {}", identity);
    } else {
        let new_goals = UserGoals {
            identity,
            goal_type: goal_type.clone(),
            target_weight_kg,
            daily_calorie_target,
            protein_target_g,
            carb_target_g,
            fat_target_g,
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        };
        match ctx.db.user_goals().try_insert(new_goals) {
            Ok(_) => spacetimedb::log::info!("Created goals for {}", identity),
            Err(e) => {
                let msg = format!("Failed to set goals: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn add_food_item(
    ctx: &ReducerContext,
    name: String,
    name_tr: String,
    calories_per_100g: f32,
    protein_per_100g: f32,
    carbs_per_100g: f32,
    fat_per_100g: f32,
    fiber_per_100g: f32,
    category: String,
    is_custom: bool,
) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Food name cannot be empty".into());
    }
    if calories_per_100g < 0.0
        || protein_per_100g < 0.0
        || carbs_per_100g < 0.0
        || fat_per_100g < 0.0
        || fiber_per_100g < 0.0
    {
        return Err("Nutrient values cannot be negative".into());
    }

    let created_by = if is_custom { ctx.sender } else { ctx.identity() };
    let item = FoodItem {
        id: 0,
        name: name.clone(),
        name_tr: name_tr.clone(),
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        fiber_per_100g,
        category: category.clone(),
        is_custom,
        created_by_identity: created_by,
    };
    match ctx.db.food_item().try_insert(item) {
        Ok(row) => {
            spacetimedb::log::info!("Added food item '{}' with id {}", name, row.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to add food item: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn log_meal(
    ctx: &ReducerContext,
    food_id: u64,
    meal_type: MealType,
    portion_grams: f32,
    date: Date,
) -> Result<(), String> {
    if portion_grams <= 0.0 {
        return Err("Portion grams must be positive".into());
    }
    if ctx.db.food_item().id().find(&food_id).is_none() {
        return Err(format!("Food item with id {} not found", food_id));
    }

    let log = DailyLog {
        id: 0,
        user_identity: ctx.sender,
        food_id,
        meal_type: meal_type.clone(),
        portion_grams,
        date: date.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.daily_log().try_insert(log) {
        Ok(row) => {
            spacetimedb::log::info!("Logged meal id {} for {}", row.id, ctx.sender);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log meal: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn delete_meal_log(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(entry) = ctx.db.daily_log().id().find(&id) {
        if entry.user_identity != ctx.sender {
            return Err("Not authorized to delete this meal log".into());
        }
        ctx.db.daily_log().id().delete(&id);
        spacetimedb::log::info!("Deleted meal log {}", id);
        Ok(())
    } else {
        Err("Meal log not found".into())
    }
}

#[reducer]
pub fn log_exercise(
    ctx: &ReducerContext,
    exercise_name: String,
    duration_minutes: f32,
    calories_burned: f32,
    date: Date,
) -> Result<(), String> {
    if exercise_name.trim().is_empty() {
        return Err("Exercise name cannot be empty".into());
    }
    if duration_minutes <= 0.0 {
        return Err("Duration must be positive".into());
    }
    if calories_burned < 0.0 {
        return Err("Calories burned cannot be negative".into());
    }

    let log = ExerciseLog {
        id: 0,
        user_identity: ctx.sender,
        exercise_name: exercise_name.clone(),
        duration_minutes,
        calories_burned,
        date: date.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.exercise_log().try_insert(log) {
        Ok(row) => {
            spacetimedb::log::info!("Logged exercise id {} for {}", row.id, ctx.sender);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log exercise: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn delete_exercise_log(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(entry) = ctx.db.exercise_log().id().find(&id) {
        if entry.user_identity != ctx.sender {
            return Err("Not authorized to delete this exercise log".into());
        }
        ctx.db.exercise_log().id().delete(&id);
        spacetimedb::log::info!("Deleted exercise log {}", id);
        Ok(())
    } else {
        Err("Exercise log not found".into())
    }
}

#[reducer]
pub fn create_recipe(
    ctx: &ReducerContext,
    name: String,
    description: String,
    servings: u32,
    ingredients: Vec<RecipeIngredient>,
) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Recipe name cannot be empty".into());
    }
    if servings == 0 {
        return Err("Servings must be at least 1".into());
    }
    if ingredients.is_empty() {
        return Err("Recipe must have at least one ingredient".into());
    }

    // Compute totals based on ingredient foods
    let mut total_calories = 0.0f32;
    let mut total_protein = 0.0f32;
    let mut total_carbs = 0.0f32;
    let mut total_fat = 0.0f32;

    for ing in &ingredients {
        if let Some(food) = ctx.db.food_item().id().find(&ing.food_id) {
            let factor = ing.grams / 100.0f32;
            total_calories += food.calories_per_100g * factor;
            total_protein += food.protein_per_100g * factor;
            total_carbs += food.carbs_per_100g * factor;
            total_fat += food.fat_per_100g * factor;
        } else {
            return Err(format!("Ingredient food_id {} not found", ing.food_id));
        }
    }

    let recipe = Recipe {
        id: 0,
        user_identity: ctx.sender,
        name: name.clone(),
        description: description.clone(),
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        servings,
        ingredients: ingredients.clone(),
        created_at: ctx.timestamp,
    };
    match ctx.db.recipe().try_insert(recipe) {
        Ok(row) => {
            spacetimedb::log::info!("Created recipe '{}' with id {}", name, row.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to create recipe: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn delete_recipe(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(r) = ctx.db.recipe().id().find(&id) {
        if r.user_identity != ctx.sender {
            return Err("Not authorized to delete this recipe".into());
        }
        ctx.db.recipe().id().delete(&id);
        spacetimedb::log::info!("Deleted recipe {}", id);
        Ok(())
    } else {
        Err("Recipe not found".into())
    }
}

#[reducer]
pub fn get_daily_summary(ctx: &ReducerContext, date: Date) -> Result<(), String> {
    // Calculate totals for this user and date
    let user = ctx.sender;

    let mut total_calories = 0.0f32;
    let mut total_protein = 0.0f32;
    let mut total_carbs = 0.0f32;
    let mut total_fat = 0.0f32;
    let mut exercise_calories = 0.0f32;

    // Aggregate meal logs
    for entry in ctx.db.daily_log().iter() {
        if entry.user_identity == user && entry.date == date {
            if let Some(food) = ctx.db.food_item().id().find(&entry.food_id) {
                let factor = entry.portion_grams / 100.0f32;
                total_calories += food.calories_per_100g * factor;
                total_protein += food.protein_per_100g * factor;
                total_carbs += food.carbs_per_100g * factor;
                total_fat += food.fat_per_100g * factor;
            }
        }
    }

    // Aggregate exercise logs
    for ex in ctx.db.exercise_log().iter() {
        if ex.user_identity == user && ex.date == date {
            exercise_calories += ex.calories_burned;
        }
    }

    let net_calories = total_calories - exercise_calories;

    let summary_id = format!(
        "{}-{:04}-{:02}-{:02}",
        user,
        date.year,
        date.month,
        date.day
    );

    if let Some(mut existing) = ctx.db.daily_summary().summary_id().find(&summary_id) {
        existing.total_calories = total_calories;
        existing.total_protein = total_protein;
        existing.total_carbs = total_carbs;
        existing.total_fat = total_fat;
        existing.exercise_calories = exercise_calories;
        existing.net_calories = net_calories;
        existing.generated_at = ctx.timestamp;
        ctx.db.daily_summary().summary_id().update(existing);
        spacetimedb::log::info!("Updated daily summary for {}", summary_id);
    } else {
        let summary = DailySummary {
            summary_id: summary_id.clone(),
            user_identity: user,
            date: date.clone(),
            total_calories,
            total_protein,
            total_carbs,
            total_fat,
            exercise_calories,
            net_calories,
            generated_at: ctx.timestamp,
        };
        match ctx.db.daily_summary().try_insert(summary) {
            Ok(_) => spacetimedb::log::info!("Created daily summary for {}", summary_id),
            Err(e) => {
                let msg = format!("Failed to create daily summary: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }

    Ok(())
}

// Phase 8 - New Reducers

// Body Measurements

#[reducer]
pub fn add_body_measurement(
    ctx: &ReducerContext,
    date: Date,
    weight_kg: f32,
    waist_cm: f32,
    hip_cm: f32,
    chest_cm: f32,
    arm_cm: f32,
    thigh_cm: f32,
    body_fat_percentage: Option<f32>,
    notes: Option<String>,
) -> Result<(), String> {
    if weight_kg <= 0.0
        || waist_cm < 0.0
        || hip_cm < 0.0
        || chest_cm < 0.0
        || arm_cm < 0.0
        || thigh_cm < 0.0
    {
        return Err("Measurements must be non-negative, weight must be positive".into());
    }
    if let Some(bfp) = body_fat_percentage {
        if bfp < 0.0 || bfp > 100.0 {
            return Err("Body fat percentage must be between 0 and 100".into());
        }
    }

    let row = BodyMeasurement {
        id: 0,
        user_identity: ctx.sender,
        date: date.clone(),
        weight_kg,
        waist_cm,
        hip_cm,
        chest_cm,
        arm_cm,
        thigh_cm,
        body_fat_percentage,
        notes: notes.clone(),
    };
    match ctx.db.body_measurement().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Added body measurement {} for {}", inserted.id, ctx.sender);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to add body measurement: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

// Note: Clients should subscribe to body_measurement filtered by user_identity to get all rows.
#[reducer]
pub fn get_body_measurements_for_user(ctx: &ReducerContext) -> Result<(), String> {
    spacetimedb::log::info!("Body measurements requested for {}", ctx.sender);
    Ok(())
}

#[reducer]
pub fn delete_body_measurement(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(row) = ctx.db.body_measurement().id().find(&id) {
        if row.user_identity != ctx.sender {
            return Err("Not authorized to delete this body measurement".into());
        }
        ctx.db.body_measurement().id().delete(&id);
        spacetimedb::log::info!("Deleted body measurement {}", id);
        Ok(())
    } else {
        Err("Body measurement not found".into())
    }
}

// Progress Photos

#[reducer]
pub fn add_progress_photo(
    ctx: &ReducerContext,
    date: Date,
    photo_url: String,
    notes: Option<String>,
    measurements_snapshot: Option<String>,
) -> Result<(), String> {
    if photo_url.trim().is_empty() {
        return Err("photo_url cannot be empty".into());
    }
    let row = ProgressPhoto {
        id: 0,
        user_identity: ctx.sender,
        date: date.clone(),
        photo_url: photo_url.clone(),
        notes: notes.clone(),
        measurements_snapshot: measurements_snapshot.clone(),
    };
    match ctx.db.progress_photo().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Added progress photo {} for {}", inserted.id, ctx.sender);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to add progress photo: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

// Note: Clients should subscribe to progress_photo filtered by user_identity to get all rows.
#[reducer]
pub fn get_progress_photos_for_user(ctx: &ReducerContext) -> Result<(), String> {
    spacetimedb::log::info!("Progress photos requested for {}", ctx.sender);
    Ok(())
}

#[reducer]
pub fn delete_progress_photo(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(row) = ctx.db.progress_photo().id().find(&id) {
        if row.user_identity != ctx.sender {
            return Err("Not authorized to delete this progress photo".into());
        }
        ctx.db.progress_photo().id().delete(&id);
        spacetimedb::log::info!("Deleted progress photo {}", id);
        Ok(())
    } else {
        Err("Progress photo not found".into())
    }
}

// Favorite Foods

#[reducer]
pub fn add_food_to_favorites(
    ctx: &ReducerContext,
    food_id: String,
    food_name: String,
    calories: f32,
    protein: f32,
    carbs: f32,
    fat: f32,
    typical_serving_size: String,
) -> Result<(), String> {
    if food_id.trim().is_empty() || food_name.trim().is_empty() {
        return Err("food_id and food_name cannot be empty".into());
    }
    if calories < 0.0 || protein < 0.0 || carbs < 0.0 || fat < 0.0 {
        return Err("Nutrient values cannot be negative".into());
    }
    // Check if already favorited
    for fav in ctx.db.favorite_food().iter() {
        if fav.user_identity == ctx.sender && fav.food_id == food_id {
            return Err("Food is already in favorites".into());
        }
    }
    let row = FavoriteFood {
        id: 0,
        user_identity: ctx.sender,
        food_id: food_id.clone(),
        food_name: food_name.clone(),
        calories,
        protein,
        carbs,
        fat,
        typical_serving_size: typical_serving_size.clone(),
        date_added: ctx.timestamp,
    };
    match ctx.db.favorite_food().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Added favorite food {} (id {})", food_name, inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to add favorite food: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

// Note: Clients should subscribe to favorite_food filtered by user_identity to get all rows.
#[reducer]
pub fn get_favorite_foods_for_user(ctx: &ReducerContext) -> Result<(), String> {
    spacetimedb::log::info!("Favorite foods requested for {}", ctx.sender);
    Ok(())
}

#[reducer]
pub fn remove_food_from_favorites(ctx: &ReducerContext, food_id: String) -> Result<(), String> {
    // Remove the favorite entry for this user and food_id
    let mut to_delete: Option<u64> = None;
    for fav in ctx.db.favorite_food().iter() {
        if fav.user_identity == ctx.sender && fav.food_id == food_id {
            to_delete = Some(fav.id);
            break;
        }
    }
    if let Some(id) = to_delete {
        ctx.db.favorite_food().id().delete(&id);
        spacetimedb::log::info!("Removed favorite food id {}", id);
        Ok(())
    } else {
        Err("Favorite food not found for this user and food_id".into())
    }
}

#[reducer]
pub fn check_food_favorited(ctx: &ReducerContext, food_id: String) -> Result<(), String> {
    let mut is_favorited = false;
    for fav in ctx.db.favorite_food().iter() {
        if fav.user_identity == ctx.sender && fav.food_id == food_id {
            is_favorited = true;
            break;
        }
    }
    let status_id = format!("{}:{}", ctx.sender, food_id);
    if let Some(mut status) = ctx.db.favorite_food_status().status_id().find(&status_id) {
        status.is_favorited = is_favorited;
        status.checked_at = ctx.timestamp;
        ctx.db.favorite_food_status().status_id().update(status);
        spacetimedb::log::info!("Updated favorite status {}", status_id);
    } else {
        let status = FavoriteFoodStatus {
            status_id: status_id.clone(),
            user_identity: ctx.sender,
            food_id: food_id.clone(),
            is_favorited,
            checked_at: ctx.timestamp,
        };
        match ctx.db.favorite_food_status().try_insert(status) {
            Ok(_) => spacetimedb::log::info!("Created favorite status {}", status_id),
            Err(e) => {
                let msg = format!("Failed to write favorite status: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

// Wellness Feature Reducers

// Mood and Energy Tracking

#[reducer]
pub fn upsert_mood_entry(
    ctx: &ReducerContext,
    date: Date,
    mood_score: u8,
    energy_score: u8,
    notes: Option<String>,
) -> Result<(), String> {
    if mood_score < 1 || mood_score > 5 {
        return Err("mood_score must be between 1 and 5".into());
    }
    if energy_score < 1 || energy_score > 5 {
        return Err("energy_score must be between 1 and 5".into());
    }
    // Try to find existing entry for user+date
    let mut existing_id: Option<u64> = None;
    for m in ctx.db.mood_entry().iter() {
        if m.user_identity == ctx.sender && m.date == date {
            existing_id = Some(m.id);
            break;
        }
    }
    if let Some(id) = existing_id {
        if let Some(mut row) = ctx.db.mood_entry().id().find(&id) {
            row.mood_score = mood_score;
            row.energy_score = energy_score;
            row.notes = notes.clone();
            row.timestamp = ctx.timestamp;
            ctx.db.mood_entry().id().update(row);
            spacetimedb::log::info!("Updated mood entry {} for {}", id, ctx.sender);
        }
    } else {
        let row = MoodEntry {
            id: 0,
            user_identity: ctx.sender,
            date: date.clone(),
            mood_score,
            energy_score,
            notes: notes.clone(),
            timestamp: ctx.timestamp,
        };
        match ctx.db.mood_entry().try_insert(row) {
            Ok(inserted) => {
                spacetimedb::log::info!("Inserted mood entry {} for {}", inserted.id, ctx.sender);
            }
            Err(e) => {
                let msg = format!("Failed to insert mood entry: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn delete_mood_entry(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(row) = ctx.db.mood_entry().id().find(&id) {
        if row.user_identity != ctx.sender {
            return Err("Not authorized to delete this mood entry".into());
        }
        ctx.db.mood_entry().id().delete(&id);
        spacetimedb::log::info!("Deleted mood entry {}", id);
        Ok(())
    } else {
        Err("Mood entry not found".into())
    }
}

#[reducer]
pub fn generate_mood_trend_summary(
    ctx: &ReducerContext,
    start_date: Date,
    end_date: Date,
) -> Result<(), String> {
    if !date_leq(&start_date, &end_date) {
        return Err("start_date must be <= end_date".into());
    }
    let mut sum_mood: u64 = 0;
    let mut sum_energy: u64 = 0;
    let mut count: u32 = 0;
    for m in ctx.db.mood_entry().iter() {
        if m.user_identity == ctx.sender && date_in_range(&m.date, &start_date, &end_date) {
            sum_mood += m.mood_score as u64;
            sum_energy += m.energy_score as u64;
            count += 1;
        }
    }
    let avg_mood = if count > 0 { (sum_mood as f32) / (count as f32) } else { 0.0 };
    let avg_energy = if count > 0 { (sum_energy as f32) / (count as f32) } else { 0.0 };
    let summary_id = format!(
        "{}:{:04}-{:02}-{:02}:{:04}-{:02}-{:02}",
        ctx.sender,
        start_date.year, start_date.month, start_date.day,
        end_date.year, end_date.month, end_date.day
    );
    if let Some(mut row) = ctx.db.mood_trend_summary().summary_id().find(&summary_id) {
        row.entry_count = count;
        row.avg_mood = avg_mood;
        row.avg_energy = avg_energy;
        row.generated_at = ctx.timestamp;
        ctx.db.mood_trend_summary().summary_id().update(row);
        spacetimedb::log::info!("Updated mood trend {}", summary_id);
    } else {
        let row = MoodTrendSummary {
            summary_id: summary_id.clone(),
            user_identity: ctx.sender,
            start_date: start_date.clone(),
            end_date: end_date.clone(),
            entry_count: count,
            avg_mood,
            avg_energy,
            generated_at: ctx.timestamp,
        };
        match ctx.db.mood_trend_summary().try_insert(row) {
            Ok(_) => spacetimedb::log::info!("Created mood trend {}", summary_id),
            Err(e) => {
                let msg = format!("Failed to create mood trend: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

// Supplement Tracking

#[reducer]
pub fn add_supplement(
    ctx: &ReducerContext,
    name: String,
    dosage: String,
    time_of_day: TimeOfDay,
) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Supplement name cannot be empty".into());
    }
    if time_of_day.hour > 23 || time_of_day.minute > 59 {
        return Err("Invalid time_of_day".into());
    }
    // Ensure not duplicate name for this user
    for s in ctx.db.supplement().iter() {
        if s.user_identity == ctx.sender && s.name == name {
            return Err("Supplement with this name already exists".into());
        }
    }
    let row = Supplement {
        id: 0,
        user_identity: ctx.sender,
        name: name.clone(),
        dosage: dosage.clone(),
        time_of_day: time_of_day.clone(),
        is_active: true,
        created_at: ctx.timestamp,
    };
    match ctx.db.supplement().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Created supplement {} (id {})", name, inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to create supplement: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn set_supplement_active(ctx: &ReducerContext, supplement_id: u64, is_active: bool) -> Result<(), String> {
    if let Some(mut s) = ctx.db.supplement().id().find(&supplement_id) {
        if s.user_identity != ctx.sender {
            return Err("Not authorized to update this supplement".into());
        }
        s.is_active = is_active;
        ctx.db.supplement().id().update(s);
        spacetimedb::log::info!("Updated supplement {} active={}", supplement_id, is_active);
        Ok(())
    } else {
        Err("Supplement not found".into())
    }
}

#[reducer]
pub fn log_supplement_intake(
    ctx: &ReducerContext,
    supplement_id: u64,
    date: Date,
    taken: bool,
) -> Result<(), String> {
    if let Some(s) = ctx.db.supplement().id().find(&supplement_id) {
        if s.user_identity != ctx.sender {
            return Err("Not authorized to log for this supplement".into());
        }
    } else {
        return Err("Supplement not found".into());
    }

    // Upsert per user+supplement+date
    let mut existing_id: Option<u64> = None;
    for l in ctx.db.supplement_log().iter() {
        if l.user_identity == ctx.sender && l.supplement_id == supplement_id && l.date == date {
            existing_id = Some(l.id);
            break;
        }
    }
    if let Some(id) = existing_id {
        if let Some(mut row) = ctx.db.supplement_log().id().find(&id) {
            row.taken = taken;
            row.timestamp = ctx.timestamp;
            ctx.db.supplement_log().id().update(row);
            spacetimedb::log::info!("Updated supplement log {} for {}", id, ctx.sender);
        }
    } else {
        let row = SupplementLog {
            id: 0,
            user_identity: ctx.sender,
            supplement_id,
            date: date.clone(),
            taken,
            timestamp: ctx.timestamp,
        };
        match ctx.db.supplement_log().try_insert(row) {
            Ok(inserted) => {
                spacetimedb::log::info!("Inserted supplement log {} for {}", inserted.id, ctx.sender);
            }
            Err(e) => {
                let msg = format!("Failed to insert supplement log: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn compute_supplement_completion(
    ctx: &ReducerContext,
    supplement_id: u64,
    start_date: Date,
    end_date: Date,
) -> Result<(), String> {
    if !date_leq(&start_date, &end_date) {
        return Err("start_date must be <= end_date".into());
    }
    // Validate ownership
    if let Some(s) = ctx.db.supplement().id().find(&supplement_id) {
        if s.user_identity != ctx.sender {
            return Err("Not authorized for this supplement".into());
        }
    } else {
        return Err("Supplement not found".into());
    }

    let start_ord = date_to_ordinal(&start_date);
    let end_ord = date_to_ordinal(&end_date);
    let scheduled_days = if end_ord >= start_ord { (end_ord - start_ord + 1) as u32 } else { 0 };

    // Count days with taken=true (deduplicate per day)
    let mut taken_days: u32 = 0;
    for ord in start_ord..=end_ord {
        let d = ordinal_to_date(ord);
        let mut taken_today = false;
        for l in ctx.db.supplement_log().iter() {
            if l.user_identity == ctx.sender && l.supplement_id == supplement_id && l.date == d {
                if l.taken { taken_today = true; break; }
            }
        }
        if taken_today { taken_days += 1; }
    }
    let rate = if scheduled_days > 0 {
        (taken_days as f32) / (scheduled_days as f32)
    } else {
        0.0
    };

    let summary_id = format!(
        "{}:{}:{:04}-{:02}-{:02}:{:04}-{:02}-{:02}",
        ctx.sender,
        supplement_id,
        start_date.year, start_date.month, start_date.day,
        end_date.year, end_date.month, end_date.day
    );
    if let Some(mut row) = ctx.db.supplement_completion_summary().summary_id().find(&summary_id) {
        row.scheduled_days = scheduled_days;
        row.taken_days = taken_days;
        row.completion_rate = rate;
        row.generated_at = ctx.timestamp;
        ctx.db.supplement_completion_summary().summary_id().update(row);
        spacetimedb::log::info!("Updated supplement completion {}", summary_id);
    } else {
        let row = SupplementCompletionSummary {
            summary_id: summary_id.clone(),
            user_identity: ctx.sender,
            supplement_id,
            start_date: start_date.clone(),
            end_date: end_date.clone(),
            scheduled_days,
            taken_days,
            completion_rate: rate,
            generated_at: ctx.timestamp,
        };
        match ctx.db.supplement_completion_summary().try_insert(row) {
            Ok(_) => spacetimedb::log::info!("Created supplement completion {}", summary_id),
            Err(e) => {
                let msg = format!("Failed to create supplement completion: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

// Habit Tracking

#[reducer]
pub fn create_habit(
    ctx: &ReducerContext,
    name: String,
    frequency: HabitFrequency,
    target_value: f32,
    unit: String,
    icon: String,
    color: String,
) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Habit name cannot be empty".into());
    }
    if target_value <= 0.0 {
        return Err("target_value must be positive".into());
    }
    for h in ctx.db.habit().iter() {
        if h.user_identity == ctx.sender && h.name == name {
            return Err("Habit with this name already exists".into());
        }
    }
    let row = Habit {
        id: 0,
        user_identity: ctx.sender,
        name: name.clone(),
        frequency: frequency.clone(),
        target_value,
        unit: unit.clone(),
        icon: icon.clone(),
        color: color.clone(),
        is_active: true,
        created_at: ctx.timestamp,
    };
    match ctx.db.habit().try_insert(row) {
        Ok(inserted) => {
            let habit_id = inserted.id;
            // Initialize streak status
            let status = HabitStreakStatus {
                habit_id,
                user_identity: ctx.sender,
                frequency: frequency.clone(),
                current_streak: 0,
                best_streak: 0,
                last_completed_date: None,
                last_counted_week_id: None,
                updated_at: ctx.timestamp,
            };
            let _ = ctx.db.habit_streak_status().try_insert(status);
            spacetimedb::log::info!("Created habit '{}' (id {})", name, habit_id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to create habit: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn set_habit_active(ctx: &ReducerContext, habit_id: u64, is_active: bool) -> Result<(), String> {
    if let Some(mut h) = ctx.db.habit().id().find(&habit_id) {
        if h.user_identity != ctx.sender {
            return Err("Not authorized to update this habit".into());
        }
        h.is_active = is_active;
        ctx.db.habit().id().update(h);
        spacetimedb::log::info!("Updated habit {} active={}", habit_id, is_active);
        Ok(())
    } else {
        Err("Habit not found".into())
    }
}

#[reducer]
pub fn log_habit(
    ctx: &ReducerContext,
    habit_id: u64,
    date: Date,
    value: f32,
) -> Result<(), String> {
    if value < 0.0 {
        return Err("value cannot be negative".into());
    }
    // Load habit and validate ownership
    let habit = if let Some(h) = ctx.db.habit().id().find(&habit_id) {
        if h.user_identity != ctx.sender {
            return Err("Not authorized to log for this habit".into());
        }
        h
    } else {
        return Err("Habit not found".into());
    };
    let is_complete = match habit.frequency {
        HabitFrequency::Daily => value >= habit.target_value,
        HabitFrequency::Weekly => false, // completion determined by weekly aggregate
    };

    // Upsert per user+habit+date
    let mut existing_id: Option<u64> = None;
    for l in ctx.db.habit_log().iter() {
        if l.user_identity == ctx.sender && l.habit_id == habit_id && l.date == date {
            existing_id = Some(l.id);
            break;
        }
    }
    if let Some(id) = existing_id {
        if let Some(mut row) = ctx.db.habit_log().id().find(&id) {
            row.value = value;
            row.is_complete = is_complete;
            row.timestamp = ctx.timestamp;
            ctx.db.habit_log().id().update(row);
            spacetimedb::log::info!("Updated habit log {} for {}", id, ctx.sender);
        }
    } else {
        let row = HabitLog {
            id: 0,
            user_identity: ctx.sender,
            habit_id,
            date: date.clone(),
            value,
            is_complete,
            timestamp: ctx.timestamp,
        };
        match ctx.db.habit_log().try_insert(row) {
            Ok(inserted) => {
                spacetimedb::log::info!("Inserted habit log {} for {}", inserted.id, ctx.sender);
            }
            Err(e) => {
                let msg = format!("Failed to insert habit log: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }

    // Update streaks
    match habit.frequency {
        HabitFrequency::Daily => {
            if is_complete {
                // Load or init status
                let mut status_opt = ctx.db.habit_streak_status().habit_id().find(&habit_id);
                if let Some(mut st) = status_opt.take() {
                    let mut new_current = st.current_streak;
                    if let Some(prev) = st.last_completed_date.clone() {
                        let d_curr = date_to_ordinal(&date);
                        let d_prev = date_to_ordinal(&prev);
                        if d_curr == d_prev {
                            // same day update -> keep streak unchanged
                        } else if d_curr == d_prev + 1 {
                            new_current = st.current_streak.saturating_add(1);
                        } else {
                            new_current = 1;
                        }
                    } else {
                        new_current = 1;
                    }
                    st.current_streak = new_current;
                    if st.best_streak < new_current {
                        st.best_streak = new_current;
                    }
                    st.last_completed_date = Some(date.clone());
                    st.updated_at = ctx.timestamp;
                    ctx.db.habit_streak_status().habit_id().update(st);
                } else {
                    let st = HabitStreakStatus {
                        habit_id,
                        user_identity: ctx.sender,
                        frequency: HabitFrequency::Daily,
                        current_streak: 1,
                        best_streak: 1,
                        last_completed_date: Some(date.clone()),
                        last_counted_week_id: None,
                        updated_at: ctx.timestamp,
                    };
                    let _ = ctx.db.habit_streak_status().try_insert(st);
                }
            }
        }
        HabitFrequency::Weekly => {
            // For weekly, compute this week's total and update streak when week crosses target
            let week_id = week_id_from_date(&date);
            let week_monday_ord = week_monday_ordinal(&date);
            let mut week_total: f32 = 0.0;
            for l in ctx.db.habit_log().iter() {
                if l.user_identity == ctx.sender && l.habit_id == habit_id {
                    if week_id_from_date(&l.date) == week_id {
                        week_total += l.value;
                    }
                }
            }
            if week_total >= habit.target_value {
                // Load or init status
                let mut status_opt = ctx.db.habit_streak_status().habit_id().find(&habit_id);
                if let Some(mut st) = status_opt.take() {
                    let already_counted = st.last_counted_week_id.clone().map_or(false, |wid| wid == week_id);
                    if !already_counted {
                        let mut new_current = 1;
                        if let Some(last_wid) = st.last_counted_week_id.clone() {
                            let last_ord = parse_week_id_to_monday_ordinal(&last_wid);
                            if week_monday_ord == last_ord + 7 {
                                new_current = st.current_streak.saturating_add(1);
                            }
                        }
                        st.current_streak = new_current;
                        if st.best_streak < new_current {
                            st.best_streak = new_current;
                        }
                        st.last_counted_week_id = Some(week_id.clone());
                        st.updated_at = ctx.timestamp;
                        ctx.db.habit_streak_status().habit_id().update(st);
                    }
                } else {
                    let st = HabitStreakStatus {
                        habit_id,
                        user_identity: ctx.sender,
                        frequency: HabitFrequency::Weekly,
                        current_streak: 1,
                        best_streak: 1,
                        last_completed_date: None,
                        last_counted_week_id: Some(week_id.clone()),
                        updated_at: ctx.timestamp,
                    };
                    let _ = ctx.db.habit_streak_status().try_insert(st);
                }
            }
        }
    }

    Ok(())
}

#[reducer]
pub fn delete_habit_log(ctx: &ReducerContext, id: u64) -> Result<(), String> {
    if let Some(row) = ctx.db.habit_log().id().find(&id) {
        if row.user_identity != ctx.sender {
            return Err("Not authorized to delete this habit log".into());
        }
        ctx.db.habit_log().id().delete(&id);
        spacetimedb::log::info!("Deleted habit log {}", id);
        Ok(())
    } else {
        Err("Habit log not found".into())
    }
}

// Subscription Management Reducers

#[reducer]
pub fn create_or_update_subscription(
    ctx: &ReducerContext,
    plan_type: PlanType,
    start_date: Option<Date>,
) -> Result<(), String> {
    // Determine start date (default to "today" from timestamp)
    let mut start = start_date.unwrap_or_else(|| date_from_timestamp(ctx.timestamp));

    // Compute end date based on plan
    let end_date = match plan_type {
        PlanType::Free => None,
        PlanType::Monthly => {
            // end at the day before the same day next month
            let next = add_months(&start, 1);
            Some(add_days(&next, -1i64))
        }
        PlanType::Quarterly => {
            let next = add_months(&start, 3);
            Some(add_days(&next, -1i64))
        }
        PlanType::Yearly => {
            let next = add_months(&start, 12);
            Some(add_days(&next, -1i64))
        }
    };

    // Ensure start is not after end_date if present
    if let Some(ed) = &end_date {
        if !date_leq(&start, ed) {
            // If invalid (e.g., end < start), clamp start to end
            start = ed.clone();
        }
    }

    let identity = ctx.sender;
    if let Some(mut sub) = ctx.db.subscription().identity().find(&identity) {
        sub.plan_type = plan_type.clone();
        sub.start_date = start.clone();
        sub.end_date = end_date.clone();
        // status: if paid plan -> Active; Free -> Active
        sub.status = SubscriptionStatus::Active;
        sub.updated_at = ctx.timestamp;
        ctx.db.subscription().identity().update(sub);
        spacetimedb::log::info!("Updated subscription for {}", identity);
    } else {
        let sub = Subscription {
            identity,
            plan_type: plan_type.clone(),
            status: SubscriptionStatus::Active,
            start_date: start.clone(),
            end_date: end_date.clone(),
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        };
        match ctx.db.subscription().try_insert(sub) {
            Ok(_) => spacetimedb::log::info!("Created subscription for {}", identity),
            Err(e) => {
                let msg = format!("Failed to create subscription: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn get_user_subscription(ctx: &ReducerContext) -> Result<(), String> {
    // Ensure there's always a row to subscribe to (default Free)
    let identity = ctx.sender;
    if ctx.db.subscription().identity().find(&identity).is_none() {
        let today = date_from_timestamp(ctx.timestamp);
        let sub = Subscription {
            identity,
            plan_type: PlanType::Free,
            status: SubscriptionStatus::Active,
            start_date: today.clone(),
            end_date: None,
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        };
        let _ = ctx.db.subscription().try_insert(sub);
        spacetimedb::log::info!("Initialized default Free subscription for {}", identity);
    } else {
        spacetimedb::log::info!("Subscription requested for {}", identity);
    }
    Ok(())
}

#[reducer]
pub fn check_premium_access(ctx: &ReducerContext) -> Result<(), String> {
    let identity = ctx.sender;
    let today = date_from_timestamp(ctx.timestamp);

    // Ensure row exists
    if ctx.db.subscription().identity().find(&identity).is_none() {
        let sub = Subscription {
            identity,
            plan_type: PlanType::Free,
            status: SubscriptionStatus::Active,
            start_date: today.clone(),
            end_date: None,
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        };
        let _ = ctx.db.subscription().try_insert(sub);
        spacetimedb::log::info!("Initialized default Free subscription for {}", identity);
    }

    if let Some(mut sub) = ctx.db.subscription().identity().find(&identity) {
        // Determine if expired or active
        let mut new_status = sub.status.clone();

        // If canceled or paused, keep as is; otherwise recompute Active/Expired by date and plan
        if matches!(sub.status, SubscriptionStatus::Active | SubscriptionStatus::Expired) {
            if is_paid_plan(&sub.plan_type) {
                // Active if today within [start, end]
                let within = date_leq(&sub.start_date, &today)
                    && sub.end_date.as_ref().map_or(true, |ed| date_leq(&today, ed));
                new_status = if within { SubscriptionStatus::Active } else { SubscriptionStatus::Expired };
            } else {
                // Free is always Active but not premium
                new_status = SubscriptionStatus::Active;
            }
        }

        // Apply status update if changed
        let status_changed = new_status != sub.status;
        if status_changed {
            sub.status = new_status.clone();
            sub.updated_at = ctx.timestamp;
            ctx.db.subscription().identity().update(sub);
        }

        spacetimedb::log::info!(
            "Premium access check evaluated for {}",
            identity
        );
    }

    Ok(())
}

// AI Nutrition Coach - Reducers

#[reducer]
pub fn start_trial(ctx: &ReducerContext, identity: Identity) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to start trial for this identity".into());
    }
    let today = date_from_timestamp(ctx.timestamp);
    let end = add_days(&today, 2); // inclusive 3-day window
    if let Some(mut t) = ctx.db.trial_status().identity().find(&identity) {
        t.start_date = today.clone();
        t.end_date = end.clone();
        t.daily_message_limit = 10;
        t.messages_used_today = 0;
        t.is_active = true;
        t.last_reset_date = today.clone();
        ctx.db.trial_status().identity().update(t);
        spacetimedb::log::info!("Trial restarted for {}", identity);
    } else {
        let row = TrialStatus {
            identity,
            start_date: today.clone(),
            end_date: end.clone(),
            daily_message_limit: 10,
            messages_used_today: 0,
            is_active: true,
            last_reset_date: today.clone(),
        };
        match ctx.db.trial_status().try_insert(row) {
            Ok(_) => spacetimedb::log::info!("Trial started for {}", identity),
            Err(e) => {
                let msg = format!("Failed to start trial: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn check_ai_access(ctx: &ReducerContext, identity: Identity) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to check access for this identity".into());
    }

    ensure_trial_daily_reset(ctx, identity);

    let today = date_from_timestamp(ctx.timestamp);
    let mut trial_ok = false;
    if let Some(mut t) = ctx.db.trial_status().identity().find(&identity) {
        let within = date_leq(&t.start_date, &today) && date_leq(&today, &t.end_date);
        let allowed_today = t.messages_used_today < t.daily_message_limit;
        trial_ok = within && allowed_today && t.is_active;
        // keep is_active in sync with date window
        let new_active = within;
        if new_active != t.is_active {
            t.is_active = new_active;
            ctx.db.trial_status().identity().update(t);
        }
    }

    let ad_ok = if let Some(ac) = ctx.db.ad_credit().identity().find(&identity) {
        ac.credits_remaining > 0
    } else {
        false
    };

    let premium_ok = has_premium_access(ctx, identity);

    let access = premium_ok || trial_ok || ad_ok;
    if access {
        spacetimedb::log::info!("AI access granted for {}", identity);
        Ok(())
    } else {
        Err("AI access denied: no active trial, premium, or ad credits".into())
    }
}

#[reducer]
pub fn add_ad_credits(ctx: &ReducerContext, identity: Identity, credits: u32) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to add ad credits for this identity".into());
    }
    let micros = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    if let Some(mut ac) = ctx.db.ad_credit().identity().find(&identity) {
        let new_total = ac.credits_remaining.saturating_add(credits);
        ac.credits_remaining = new_total;
        ac.last_ad_watched = micros;
        ctx.db.ad_credit().identity().update(ac);
        spacetimedb::log::info!("Added {} ad credits for {}", credits, identity);
    } else {
        let row = AdCredit {
            identity,
            credits_remaining: credits,
            last_ad_watched: micros,
        };
        match ctx.db.ad_credit().try_insert(row) {
            Ok(_) => spacetimedb::log::info!("Initialized ad credits for {}", identity),
            Err(e) => {
                let msg = format!("Failed to add ad credits: {}", e);
                spacetimedb::log::error!("{}", msg);
                return Err(msg);
            }
        }
    }
    Ok(())
}

#[reducer]
pub fn consume_ai_credit(ctx: &ReducerContext, identity: Identity) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to consume credit for this identity".into());
    }

    ensure_trial_daily_reset(ctx, identity);

    // Premium users don't need to consume credits
    if has_premium_access(ctx, identity) {
        spacetimedb::log::info!("Premium access: no credit consumed for {}", identity);
        return Ok(());
    }

    let today = date_from_timestamp(ctx.timestamp);

    // Try consuming from trial daily limit first
    if let Some(mut t) = ctx.db.trial_status().identity().find(&identity) {
        let within = date_leq(&t.start_date, &today) && date_leq(&today, &t.end_date);
        let can_use = within && t.is_active && t.messages_used_today < t.daily_message_limit;
        if can_use {
            t.messages_used_today = t.messages_used_today.saturating_add(1);
            ctx.db.trial_status().identity().update(t);
            spacetimedb::log::info!("Consumed trial daily message for {}", identity);
            return Ok(());
        } else {
            // If outside window, mark inactive
            if t.is_active && !within {
                t.is_active = false;
                ctx.db.trial_status().identity().update(t);
            }
        }
    }

    // Fall back to ad credits
    if let Some(mut ac) = ctx.db.ad_credit().identity().find(&identity) {
        if ac.credits_remaining > 0 {
            ac.credits_remaining -= 1;
            ctx.db.ad_credit().identity().update(ac);
            spacetimedb::log::info!("Consumed ad credit for {}", identity);
            return Ok(());
        }
    }

    Err("No AI credits available to consume".into())
}

#[reducer]
pub fn save_ai_message(
    ctx: &ReducerContext,
    identity: Identity,
    message: String,
    response: String,
) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to save message for this identity".into());
    }
    if message.trim().is_empty() {
        return Err("Message cannot be empty".into());
    }
    if response.trim().is_empty() {
        return Err("Response cannot be empty".into());
    }
    let now_micros = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let row = AIMessage {
        id: 0,
        identity,
        message: message.clone(),
        response: response.clone(),
        timestamp: now_micros,
    };
    match ctx.db.ai_message().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Saved AI message {} for {}", inserted.id, identity);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to save AI message: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn reset_daily_trial_limit(ctx: &ReducerContext, identity: Identity) -> Result<(), String> {
    if identity != ctx.sender {
        return Err("Not authorized to reset trial limit for this identity".into());
    }
    ensure_trial_daily_reset(ctx, identity);
    spacetimedb::log::info!("Daily trial limit checked/reset for {}", identity);
    Ok(())
}

// Admin System Reducers

#[reducer]
pub fn create_admin_user(
    ctx: &ReducerContext,
    target_identity: Identity,
    email: String,
    role: AdminRole,
    status: AdminStatus,
) -> Result<(), String> {
    if email.trim().is_empty() {
        return Err("Email cannot be empty".into());
    }

    // Allow bootstrap: if no admin users exist, the first caller can create
    let admin_count = ctx.db.admin_user().count();

    if admin_count > 0 {
        // Require SuperAdmin and Active
        let caller = ctx.sender;
        let caller_row = ctx.db.admin_user().identity().find(&caller);
        match caller_row {
            Some(a) => {
                if a.status != AdminStatus::Active {
                    return Err("Admin status is not Active".into());
                }
                if a.role != AdminRole::SuperAdmin {
                    return Err("Only SuperAdmin can create admin users".into());
                }
            }
            None => return Err("Caller is not an admin".into()),
        }
    }

    // Ensure no duplicate email
    let email_lc = email.to_lowercase();
    for a in ctx.db.admin_user().iter() {
        if a.email.to_lowercase() == email_lc {
            return Err("Email already registered as admin".into());
        }
    }

    if ctx.db.admin_user().identity().find(&target_identity).is_some() {
        return Err("Admin for this identity already exists".into());
    }

    let row = AdminUser {
        identity: target_identity,
        email: email.clone(),
        role: role.clone(),
        status: status.clone(),
        created_at: ctx.timestamp,
        last_login: None,
    };
    match ctx.db.admin_user().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Admin created for identity {} with role {:?}", inserted.identity, role);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to create admin user: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn login_admin(
    ctx: &ReducerContext,
    email: String,
    ip_address: String,
) -> Result<(), String> {
    if email.trim().is_empty() {
        return Err("Email cannot be empty".into());
    }

    // Find admin by identity and email
    let me = ctx.sender;
    let admin_opt = ctx.db.admin_user().identity().find(&me);
    let admin = if let Some(a) = admin_opt {
        if a.email.to_lowercase() != email.to_lowercase() {
            return Err("Email does not match this admin identity".into());
        }
        if a.status != AdminStatus::Active {
            return Err("Admin account is not active".into());
        }
        a
    } else {
        return Err("Admin account not found".into());
    };

    // Update last_login
    if let Some(mut a2) = ctx.db.admin_user().identity().find(&admin.identity) {
        a2.last_login = Some(ctx.timestamp);
        ctx.db.admin_user().identity().update(a2);
    }

    // Create session, 24h expiry
    let micros = ctx.timestamp.to_micros_since_unix_epoch();
    let session_id = format!("{}-{}", me, micros);
    let expiry = ctx
        .timestamp
        .checked_add(TimeDuration::from_duration(Duration::from_secs(24 * 3600)))
        .unwrap_or(ctx.timestamp);

    let session = AdminSession {
        session_id: session_id.clone(),
        admin_identity: me,
        ip_address: ip_address.clone(),
        created_at: ctx.timestamp,
        expires_at: expiry,
    };
    match ctx.db.admin_session().try_insert(session) {
        Ok(_) => {
            spacetimedb::log::info!("Admin session created {}", session_id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to create admin session: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn verify_admin_session(ctx: &ReducerContext, session_id: String) -> Result<(), String> {
    if session_id.trim().is_empty() {
        return Err("session_id cannot be empty".into());
    }
    if let Some(s) = ctx.db.admin_session().session_id().find(&session_id) {
        if s.admin_identity != ctx.sender {
            return Err("Session does not belong to caller".into());
        }
        // Check expiration
        let now_micros = ctx.timestamp.to_micros_since_unix_epoch();
        let exp_micros = s.expires_at.to_micros_since_unix_epoch();
        if now_micros > exp_micros {
            // Expired -> delete
            ctx.db.admin_session().session_id().delete(&session_id);
            return Err("Session expired".into());
        }
        // Also verify admin status still active
        if let Some(admin) = ctx.db.admin_user().identity().find(&s.admin_identity) {
            if admin.status != AdminStatus::Active {
                return Err("Admin status not active".into());
            }
        } else {
            return Err("Admin no longer exists".into());
        }
        spacetimedb::log::info!("Session verified {}", session_id);
        Ok(())
    } else {
        Err("Session not found".into())
    }
}

#[reducer]
pub fn logout_admin(ctx: &ReducerContext, session_id: String) -> Result<(), String> {
    if session_id.trim().is_empty() {
        return Err("session_id cannot be empty".into());
    }
    if let Some(s) = ctx.db.admin_session().session_id().find(&session_id) {
        if s.admin_identity != ctx.sender {
            return Err("Not authorized to logout this session".into());
        }
        ctx.db.admin_session().session_id().delete(&session_id);
        spacetimedb::log::info!("Logged out session {}", session_id);
        Ok(())
    } else {
        Err("Session not found".into())
    }
}

#[reducer]
pub fn log_admin_action(
    ctx: &ReducerContext,
    action_type: AdminActionType,
    target_user: Option<Identity>,
    details: String,
) -> Result<(), String> {
    // Require caller to be an active admin
    let caller = ctx.sender;
    if let Some(admin) = ctx.db.admin_user().identity().find(&caller) {
        if admin.status != AdminStatus::Active {
            return Err("Admin account is not active".into());
        }
    } else {
        return Err("Caller is not an admin".into());
    }

    let row = AdminAuditLog {
        id: 0,
        admin_identity: caller,
        action_type: action_type.clone(),
        target_user,
        details: details.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.admin_audit_log().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Audit log {} recorded", inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log admin action: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn get_admin_by_identity(ctx: &ReducerContext, admin_identity: Identity) -> Result<(), String> {
    // Reducers don't return data; clients should subscribe to admin_user filtered by identity
    if ctx.db.admin_user().identity().find(&admin_identity).is_some() {
        spacetimedb::log::info!("Admin lookup requested for {}", admin_identity);
        Ok(())
    } else {
        Err("Admin not found".into())
    }
}

#[reducer]
pub fn list_admin_audit_logs(
    ctx: &ReducerContext,
    admin_identity: Option<Identity>,
    limit: u32,
) -> Result<(), String> {
    // Reducers don't return data; clients should subscribe to admin_audit_log with filters.
    // This reducer exists to provide an invocation point for clients.
    let who = admin_identity
        .map(|i| format!("{}", i))
        .unwrap_or_else(|| "any".to_string());
    spacetimedb::log::info!("Audit log list requested for admin={} limit={}", who, limit);
    Ok(())
}

// Platform Management Reducers

#[reducer]
pub fn admin_set_maintenance_mode(
    ctx: &ReducerContext,
    active: bool,
    message: String,
    scheduled_end: Option<Timestamp>,
) -> Result<(), String> {
    assert_admin(ctx, true)?; // SuperAdmin required
    let id: u8 = 1;
    if let Some(mut mm) = ctx.db.maintenance_mode().id().find(&id) {
        mm.active = active;
        mm.message = message.clone();
        mm.scheduled_end = scheduled_end;
        mm.enabled_by = Some(ctx.sender);
        mm.updated_at = ctx.timestamp;
        ctx.db.maintenance_mode().id().update(mm);
        spacetimedb::log::info!("Maintenance mode updated to active={} by {}", active, ctx.sender);
    } else {
        let mm = MaintenanceMode {
            id,
            active,
            message: message.clone(),
            enabled_by: Some(ctx.sender),
            updated_at: ctx.timestamp,
            scheduled_end,
        };
        let _ = ctx.db.maintenance_mode().try_insert(mm);
        spacetimedb::log::info!("Maintenance mode created active={} by {}", active, ctx.sender);
    }
    Ok(())
}

#[reducer]
pub fn admin_upsert_feature_flag(
    ctx: &ReducerContext,
    name: String,
    enabled: bool,
    rollout_pct: u8,
    description: String,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if name.trim().is_empty() {
        return Err("Feature flag name cannot be empty".into());
    }
    if rollout_pct > 100 {
        return Err("rollout_pct must be between 0 and 100".into());
    }
    if let Some(mut ff) = ctx.db.feature_flag().name().find(&name) {
        ff.enabled = enabled;
        ff.rollout_pct = rollout_pct;
        ff.description = description.clone();
        ff.updated_by = ctx.sender;
        ff.updated_at = ctx.timestamp;
        ctx.db.feature_flag().name().update(ff);
        spacetimedb::log::info!("Updated feature flag {}", name);
    } else {
        let ff = FeatureFlag {
            name: name.clone(),
            enabled,
            rollout_pct,
            description: description.clone(),
            updated_by: ctx.sender,
            updated_at: ctx.timestamp,
        };
        let _ = ctx.db.feature_flag().try_insert(ff);
        spacetimedb::log::info!("Created feature flag {}", name);
    }
    Ok(())
}

#[reducer]
pub fn admin_publish_announcement(
    ctx: &ReducerContext,
    title: String,
    body: String,
    level: AnnouncementLevel,
    starts_at: Option<Timestamp>,
    ends_at: Option<Timestamp>,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if title.trim().is_empty() {
        return Err("Title cannot be empty".into());
    }
    let row = Announcement {
        id: 0,
        title: title.clone(),
        body: body.clone(),
        level: level.clone(),
        starts_at,
        ends_at,
        created_by: ctx.sender,
        created_at: ctx.timestamp,
    };
    match ctx.db.announcement().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Announcement {} published (id {})", title, inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to publish announcement: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn admin_upsert_notification_template(
    ctx: &ReducerContext,
    template_name: String,
    subject: String,
    body: String,
    channels: Vec<String>,
    is_active: bool,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if template_name.trim().is_empty() {
        return Err("template_name cannot be empty".into());
    }
    if let Some(mut t) = ctx.db.notification_template().template_name().find(&template_name) {
        t.subject = subject.clone();
        t.body = body.clone();
        t.channels = channels.clone();
        t.is_active = is_active;
        t.updated_by = ctx.sender;
        t.updated_at = ctx.timestamp;
        ctx.db.notification_template().template_name().update(t);
        spacetimedb::log::info!("Updated notification template {}", template_name);
    } else {
        let t = NotificationTemplate {
            template_name: template_name.clone(),
            subject: subject.clone(),
            body: body.clone(),
            channels: channels.clone(),
            is_active,
            updated_by: ctx.sender,
            updated_at: ctx.timestamp,
        };
        let _ = ctx.db.notification_template().try_insert(t);
        spacetimedb::log::info!("Created notification template {}", template_name);
    }
    Ok(())
}

// Monitoring Reducers

#[reducer]
pub fn submit_bug_report(
    ctx: &ReducerContext,
    title: String,
    description: String,
    severity: Severity,
) -> Result<(), String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".into());
    }
    if description.trim().is_empty() {
        return Err("Description cannot be empty".into());
    }
    let row = BugReport {
        id: 0,
        reporter: Some(ctx.sender),
        title: title.clone(),
        description: description.clone(),
        severity: severity.clone(),
        status: BugStatus::Open,
        created_at: ctx.timestamp,
        triaged_by: None,
        triaged_at: None,
    };
    match ctx.db.bug_report().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Bug report {} created (id {})", title, inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to submit bug report: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn admin_triage_bug_report(
    ctx: &ReducerContext,
    id: u64,
    status: BugStatus,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if let Some(mut br) = ctx.db.bug_report().id().find(&id) {
        br.status = status.clone();
        br.triaged_by = Some(ctx.sender);
        br.triaged_at = Some(ctx.timestamp);
        ctx.db.bug_report().id().update(br);
        spacetimedb::log::info!("Bug report {} triaged to {:?}", id, status);
        Ok(())
    } else {
        Err("Bug report not found".into())
    }
}

#[reducer]
pub fn log_error_event(
    ctx: &ReducerContext,
    source: String,
    message: String,
    stack_trace: Option<String>,
    severity: Severity,
    environment: String,
) -> Result<(), String> {
    if source.trim().is_empty() || message.trim().is_empty() {
        return Err("source and message cannot be empty".into());
    }
    let row = ErrorLog {
        id: 0,
        source: source.clone(),
        message: message.clone(),
        stack_trace: stack_trace.clone(),
        severity: severity.clone(),
        environment: environment.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.error_log().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Error log inserted id {}", inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log error: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn log_security_event(
    ctx: &ReducerContext,
    event_type: SecurityEventType,
    ip_address: String,
    user_agent: Option<String>,
    details: String,
) -> Result<(), String> {
    if ip_address.trim().is_empty() {
        return Err("ip_address cannot be empty".into());
    }
    let row = SecurityEvent {
        id: 0,
        event_type: event_type.clone(),
        actor_identity: Some(ctx.sender),
        ip_address: ip_address.clone(),
        user_agent: user_agent.clone(),
        details: details.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.security_event().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Security event logged id {}", inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log security event: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

// Security Reducers

#[reducer]
pub fn admin_block_ip(
    ctx: &ReducerContext,
    ip_address: String,
    reason: String,
    expires_at: Option<Timestamp>,
    is_active: bool,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if ip_address.trim().is_empty() {
        return Err("ip_address cannot be empty".into());
    }
    if let Some(mut row) = ctx.db.blocked_ip().ip_address().find(&ip_address) {
        row.reason = reason.clone();
        row.expires_at = expires_at;
        row.is_active = is_active;
        row.blocked_by = ctx.sender;
        row.blocked_at = ctx.timestamp;
        ctx.db.blocked_ip().ip_address().update(row);
        spacetimedb::log::info!("Updated blocked IP {}", ip_address);
    } else {
        let row = BlockedIP {
            ip_address: ip_address.clone(),
            reason: reason.clone(),
            blocked_by: ctx.sender,
            blocked_at: ctx.timestamp,
            expires_at,
            is_active,
        };
        let _ = ctx.db.blocked_ip().try_insert(row);
        spacetimedb::log::info!("Blocked IP {}", ip_address);
    }
    Ok(())
}

#[reducer]
pub fn admin_set_rate_limit_config(
    ctx: &ReducerContext,
    name: String,
    scope: RateLimitScope,
    endpoint_pattern: String,
    limit_per_minute: u32,
    burst: u32,
    enabled: bool,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if name.trim().is_empty() {
        return Err("name cannot be empty".into());
    }
    if endpoint_pattern.trim().is_empty() {
        return Err("endpoint_pattern cannot be empty".into());
    }
    if let Some(mut cfg) = ctx.db.rate_limit_config().name().find(&name) {
        cfg.scope = scope.clone();
        cfg.endpoint_pattern = endpoint_pattern.clone();
        cfg.limit_per_minute = limit_per_minute;
        cfg.burst = burst;
        cfg.enabled = enabled;
        cfg.updated_by = ctx.sender;
        cfg.updated_at = ctx.timestamp;
        ctx.db.rate_limit_config().name().update(cfg);
        spacetimedb::log::info!("Updated rate limit config {}", name);
    } else {
        let cfg = RateLimitConfig {
            name: name.clone(),
            scope: scope.clone(),
            endpoint_pattern: endpoint_pattern.clone(),
            limit_per_minute,
            burst,
            enabled,
            updated_by: ctx.sender,
            updated_at: ctx.timestamp,
        };
        let _ = ctx.db.rate_limit_config().try_insert(cfg);
        spacetimedb::log::info!("Created rate limit config {}", name);
    }
    Ok(())
}

// API Management Reducers

#[reducer]
pub fn admin_upsert_external_api(
    ctx: &ReducerContext,
    api_name: String,
    base_url: String,
    enabled: bool,
    quota_per_day: Option<u32>,
    auth_type: AuthType,
    key_id: Option<String>,
) -> Result<(), String> {
    assert_admin(ctx, false)?;
    if api_name.trim().is_empty() {
        return Err("api_name cannot be empty".into());
    }
    if base_url.trim().is_empty() {
        return Err("base_url cannot be empty".into());
    }
    if let Some(mut api) = ctx.db.external_api().api_name().find(&api_name) {
        api.base_url = base_url.clone();
        api.enabled = enabled;
        api.quota_per_day = quota_per_day;
        api.auth_type = auth_type.clone();
        api.key_id = key_id.clone();
        api.updated_at = ctx.timestamp;
        api.updated_by = ctx.sender;
        ctx.db.external_api().api_name().update(api);
        spacetimedb::log::info!("Updated external API {}", api_name);
    } else {
        let api = ExternalAPI {
            api_name: api_name.clone(),
            base_url: base_url.clone(),
            enabled,
            quota_per_day,
            auth_type: auth_type.clone(),
            key_id: key_id.clone(),
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
            updated_by: ctx.sender,
        };
        let _ = ctx.db.external_api().try_insert(api);
        spacetimedb::log::info!("Created external API {}", api_name);
    }
    Ok(())
}

#[reducer]
pub fn log_api_usage(
    ctx: &ReducerContext,
    api_name: String,
    endpoint: String,
    status_code: u16,
    latency_ms: u32,
    ok: bool,
    error_message: Option<String>,
) -> Result<(), String> {
    if api_name.trim().is_empty() || endpoint.trim().is_empty() {
        return Err("api_name and endpoint cannot be empty".into());
    }
    let row = APIUsageLog {
        id: 0,
        api_name: api_name.clone(),
        identity: Some(ctx.sender),
        endpoint: endpoint.clone(),
        status_code,
        latency_ms,
        ok,
        error_message: error_message.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.api_usage_log().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("API usage logged id {}", inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to log API usage: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

#[reducer]
pub fn record_system_metric(
    ctx: &ReducerContext,
    metric_name: String,
    value: f64,
    labels: Vec<String>,
) -> Result<(), String> {
    if metric_name.trim().is_empty() {
        return Err("metric_name cannot be empty".into());
    }
    let row = SystemMetric {
        id: 0,
        metric_name: metric_name.clone(),
        value,
        labels: labels.clone(),
        timestamp: ctx.timestamp,
    };
    match ctx.db.system_metric().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!("Metric '{}' recorded (id {})", metric_name, inserted.id);
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to record system metric: {}", e);
            spacetimedb::log::error!("{}", msg);
            Err(msg)
        }
    }
}

// Helper date/time functions

fn is_leap(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}
fn days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 => 31,
        2 => if is_leap(year) { 29 } else { 28 },
        3 => 31,
        4 => 30,
        5 => 31,
        6 => 30,
        7 => 31,
        8 => 31,
        9 => 30,
        10 => 31,
        11 => 30,
        12 => 31,
        _ => 30,
    }
}
fn date_leq(a: &Date, b: &Date) -> bool {
    a.year < b.year ||
    (a.year == b.year && (a.month < b.month || (a.month == b.month && a.day <= b.day)))
}
fn date_in_range(d: &Date, start: &Date, end: &Date) -> bool {
    date_leq(start, d) && date_leq(d, end)
}
// Ordinal relative to 1970-01-01 (can be negative for earlier dates)
fn date_to_ordinal(d: &Date) -> i64 {
    let mut days: i64 = 0;
    if d.year >= 1970 {
        for y in 1970..d.year {
            days += if is_leap(y) { 366 } else { 365 };
        }
    } else {
        let mut y = d.year;
        while y < 1970 {
            days -= if is_leap(y) { 366 } else { 365 };
            y += 1;
        }
    }
    let mut m = 1u32;
    while m < d.month {
        days += days_in_month(d.year, m) as i64;
        m += 1;
    }
    days + (d.day as i64 - 1)
}
fn ordinal_to_date(mut ord: i64) -> Date {
    // Convert back from ordinal since 1970-01-01
    let mut year = 1970;
    if ord >= 0 {
        loop {
            let dy = if is_leap(year) { 366 } else { 365 };
            if ord >= dy as i64 {
                ord -= dy as i64;
                year += 1;
            } else {
                break;
            }
        }
    } else {
        loop {
            year -= 1;
            let dy = if is_leap(year) { 366 } else { 365 };
            ord += dy as i64;
            if ord >= 0 {
                break;
            }
        }
    }
    let mut month = 1u32;
    loop {
        let dm = days_in_month(year, month) as i64;
        if ord >= dm {
            ord -= dm;
            month += 1;
        } else {
            break;
        }
    }
    let day = (ord + 1) as u32;
    Date { year, month, day }
}
// Sakamoto's algorithm for day of week; returns 0=Sunday..6=Saturday
fn day_of_week(d: &Date) -> u32 {
    let mut y = d.year as i64;
    let m = d.month as usize;
    let t = [0i64, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    if m < 3 { y -= 1; }
    let w = (y + y/4 - y/100 + y/400 + t[m-1] + d.day as i64) % 7;
    w as u32 // 0=Sun
}
fn week_monday_ordinal(d: &Date) -> i64 {
    let ord = date_to_ordinal(d);
    let dow_sun0 = day_of_week(d) as i64; // 0=Sun
    let mon_index = (dow_sun0 + 6) % 7; // 0=Mon
    ord - mon_index
}
fn week_id_from_date(d: &Date) -> String {
    format!("w{}", week_monday_ordinal(d))
}
fn parse_week_id_to_monday_ordinal(week_id: &str) -> i64 {
    if let Some(rest) = week_id.strip_prefix("w") {
        rest.parse::<i64>().unwrap_or(0)
    } else {
        0
    }
}

// Additional helpers for subscription

fn add_months(d: &Date, months: i32) -> Date {
    let mut year = d.year;
    let mut month_i = d.month as i32 + months;
    while month_i > 12 {
        month_i -= 12;
        year += 1;
    }
    while month_i < 1 {
        month_i += 12;
        year -= 1;
    }
    let month_u = month_i as u32;
    let dim = days_in_month(year, month_u);
    let day = if d.day > dim { dim } else { d.day };
    Date { year, month: month_u, day }
}

fn add_days(d: &Date, delta_days: i64) -> Date {
    let ord = date_to_ordinal(d);
    let new_ord = ord + delta_days;
    ordinal_to_date(new_ord)
}

fn date_from_timestamp(ts: Timestamp) -> Date {
    let micros = ts.to_micros_since_unix_epoch();
    let secs = micros.div_euclid(1_000_000);
    let days = secs.div_euclid(86_400); // days since 1970-01-01
    ordinal_to_date(days)
}

fn is_paid_plan(plan: &PlanType) -> bool {
    match plan {
        PlanType::Monthly | PlanType::Quarterly | PlanType::Yearly => true,
        PlanType::Free => false,
    }
}

// AI Nutrition Coach helpers

fn has_premium_access(ctx: &ReducerContext, identity: Identity) -> bool {
    if let Some(sub) = ctx.db.subscription().identity().find(&identity) {
        if !is_paid_plan(&sub.plan_type) {
            return false;
        }
        if !matches!(sub.status, SubscriptionStatus::Active) {
            return false;
        }
        let today = date_from_timestamp(ctx.timestamp);
        date_leq(&sub.start_date, &today) && sub.end_date.as_ref().map_or(true, |ed| date_leq(&today, ed))
    } else {
        false
    }
}

fn ensure_trial_daily_reset(ctx: &ReducerContext, identity: Identity) {
    let today = date_from_timestamp(ctx.timestamp);
    if let Some(mut t) = ctx.db.trial_status().identity().find(&identity) {
        let mut changed = false;
        if t.last_reset_date != today {
            t.messages_used_today = 0;
            t.last_reset_date = today.clone();
            changed = true;
        }
        let within = date_leq(&t.start_date, &today) && date_leq(&today, &t.end_date);
        if t.is_active != within {
            t.is_active = within;
            changed = true;
        }
        if changed {
            ctx.db.trial_status().identity().update(t);
        }
    }
}

// Admin helpers

fn assert_admin(ctx: &ReducerContext, require_superadmin: bool) -> Result<(), String> {
    if let Some(admin) = ctx.db.admin_user().identity().find(&ctx.sender) {
        if admin.status != AdminStatus::Active {
            return Err("Admin account is not active".into());
        }
        if require_superadmin && admin.role != AdminRole::SuperAdmin {
            return Err("SuperAdmin role required".into());
        }
        // Moderators cannot manage configs; for non-super admin operations, require Admin or SuperAdmin
        if !require_superadmin {
            match admin.role {
                AdminRole::Admin | AdminRole::SuperAdmin => Ok(()),
                AdminRole::Moderator => Err("Insufficient admin role".into()),
            }?;
        }
        Ok(())
    } else {
        Err("Caller is not an admin".into())
    }
}