# 条件付き期待値・線形射影 / Conditional expectation and linear projection
# 一つの建物の気温と1日の電力使用量を表す仮想モデル。実測値への当てはめではない。
# SETTINGS_BEGIN
constant <- 140
temperature <- "20"
intercept <- 100
slope <- 3
climate <- "balanced"
degree <- "1"
N <- 120L
sigma <- 12
seed <- 202L
# SETTINGS_END

# ENERGY_PLOTS: ダウンロードされるコードでは描画関数をここに埋め込む。
if (!exists("energy_plot", mode="function")) source("r/energy_plots.R", encoding="UTF-8")

degree = as.integer(degree); temperature = as.numeric(temperature)
stopifnot(N >= 3, N <= 3000, N == as.integer(N), degree %in% 1:2,
          climate %in% c("balanced","warm","cold"), temperature %in% seq(5,35,5),
          all(is.finite(c(constant,intercept,slope,sigma))), sigma > 0, sigma <= 35)
temperatures <- seq(5,35,5)
shares <- switch(climate,balanced=c(.4,.2,.4),warm=c(.2,.2,.6),cold=c(.6,.2,.2))
probability <- c(rep(shares[1]/3,3),shares[2],rep(shares[3]/3,3))
conditional_mean <- function(t) 80+.45*(t-20)^2
m <- conditional_mean(temperatures)
z_population <- temperatures-20
# x_i = (1,z_i) または (1,z_i,z_i^2) は行ベクトル。係数は列ベクトル。
design <- function(t, degree) if (degree==1) cbind(1,t-20) else cbind(1,t-20,(t-20)^2)
Xp <- design(temperatures,degree); Xlinear <- design(temperatures,1)
beta_projection <- solve(crossprod(Xp,probability*Xp),crossprod(Xp,probability*m))
beta_linear <- solve(crossprod(Xlinear,probability*Xlinear),crossprod(Xlinear,probability*m))
projection <- drop(Xp %*% beta_projection)
linear <- drop(Xlinear %*% beta_linear)
manual <- intercept+slope*z_population
population_mean <- sum(probability*m)
risk <- function(prediction) sigma^2+sum(probability*(m-prediction)^2)
orthogonality <- drop(crossprod(Xp,probability*(m-projection)))

# 日数を増やすと，既存の観測を保ち，続きの観測を加える。
# 各日の気温と誤差は独立に生成し，時系列の依存は設定しない。
set.seed(seed)
temperature_uniforms <- runif(3000)
error_uniforms <- runif(3000)
t <- temperatures[findInterval(temperature_uniforms[seq_len(N)],c(0,cumsum(probability)),rightmost.closed=TRUE)]
epsilon <- sqrt(3)*sigma*(2*error_uniforms[seq_len(N)]-1)
y <- conditional_mean(t)+epsilon
X <- design(t,degree)
if (qr(X)$rank < ncol(X)) stop("異なる気温の観測が不足している。観測日数または乱数シードを変更する。")
beta_ols <- qr.solve(X,y)
residual <- drop(y-X %*% beta_ols)
pad <- function(b) c(drop(b),rep(0,3-length(b)))
bp <- pad(beta_projection); bh <- pad(beta_ols)
values <- c(population_mean=population_mean, selected_mean=conditional_mean(temperature),
  mse_chosen_constant=risk(constant),mse_mean=risk(population_mean),
  selected_mse_mean=sigma^2+(conditional_mean(temperature)-population_mean)^2,
  mse_conditional=sigma^2,mse_manual=risk(manual),mse_linear=risk(linear),mse_projection=risk(projection),
  linear_intercept=beta_linear[1],linear_slope=beta_linear[2],
  population_intercept=bp[1],population_slope=bp[2],population_quadratic=bp[3],
  sample_intercept=bh[1],sample_slope=bh[2],sample_quadratic=bh[3],
  projection_moment=max(abs(orthogonality)),sample_normal_equation=max(abs(crossprod(X,residual))))
labels <- c("全体の平均（kWh）","選んだ気温での平均（kWh）",
  "入力した一定値の母集団MSE（kWh²）","全体の平均で予測する母集団MSE（kWh²）",
  "選んだ気温で全体の平均を使うMSE（kWh²）","気温別の平均で予測するMSE（kWh²）",
  "入力した直線の母集団MSE（kWh²）","最適な直線の母集団MSE（kWh²）","線形射影の母集団MSE（kWh²）",
  "最適な直線の切片","最適な直線の傾き","線形射影の切片","線形射影の一次項係数","線形射影の二次項係数",
  "OLSの切片","OLSの一次項係数","OLSの二次項係数","射影の直交条件の最大絶対値","X′残差の最大絶対値")
result <- list(
  settings=data.frame(setting=c("constant","temperature","intercept","slope","climate","degree","N","sigma","seed"),
    value=c(constant,temperature,intercept,slope,climate,degree,N,sigma,seed)),
  model=c("t in {5,10,15,20,25,30,35}; climate changes probabilities only",
    "y = 80 + 0.45*(t-20)^2 + epsilon; epsilon independent of t",
    "epsilon ~ Uniform(-sqrt(3)*sigma, sqrt(3)*sigma); independent observations",
    "x_i=(1,t_i-20) or (1,t_i-20,(t_i-20)^2); hypothetical model"),
  metrics=data.frame(key=names(values),label=labels,value=unname(values)),
  data=data.frame(i=seq_len(N),t=t,z=t-20,y=y,epsilon=epsilon,conditional_mean=conditional_mean(t),
    projection=drop(X %*% beta_projection),ols_fitted=drop(X %*% beta_ols),residual=residual),
  groups=data.frame(t=temperatures,probability=probability,conditional_mean=m,linear=linear,manual=manual,
    projection=projection,ols=drop(Xp %*% beta_ols)),
  plot_titles=c("気温を使わない電力使用量の予測","毎日同じ値で予測する場合の誤差","気温別の電力使用量",
    "二つの係数で決まる予測の直線","気温別の平均と線形射影","気温の構成","観測データから求めた予測"),
  plot_notes=c("青は母集団の確率密度，橙は入力した予測値，緑の破線は全体の平均。",
    "横軸は毎日使う予測値。縦軸は使用量と予測値の差を二乗した母集団の平均。",
    "点1つが1日の観測。青い点は選んだ気温の日，青い線は気温別の平均，緑は全体の平均。横位置を少しずらしている。",
    "点1つが1日。青は気温別の平均，橙は入力した切片・傾きの直線，緑は母集団MSEが最小となる直線。",
    "青は気温別の平均，緑の破線は選んだ説明変数を使う母集団の線形射影。重なる箇所は青と緑が交互に見える。",
    "棒1本が一つの気温を表す。高さはその気温の日の母集団での割合。",
    sprintf("点1つが1日を表す%d日分の仮想データ。緑は母集団の線形射影，黒い破線はこの標本のOLS。",N)))
if (!exists(".energy_draw",inherits=FALSE) || .energy_draw) for (view in energy_views) energy_plot(result,view)
print(result$metrics[,c("label","value")],row.names=FALSE)
invisible(result)
