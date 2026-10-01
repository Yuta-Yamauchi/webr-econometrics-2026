# 電力使用量の描画。保存済みの数値だけを用い，乱数を生成しない。
energy_views <- c("constant", "constant_risk", "conditional", "manual_line", "projection", "climate", "ols")
energy_metric <- function(r, key) as.numeric(r$metrics$value[match(key, r$metrics$key)])
energy_setting <- function(r, key) as.character(r$settings$value[match(key, r$settings$setting)])
energy_limits <- function(runs, view) {
  get <- function(key) vapply(runs, energy_metric, numeric(1), key = key)
  sig <- vapply(runs, function(r) as.numeric(energy_setting(r, "sigma")), numeric(1))
  m <- runs[[1]]$groups$conditional_mean
  yr <- range(c(m - sqrt(3)*max(sig), m + sqrt(3)*max(sig)))
  if (view == "conditional") yr <- range(yr, get("population_mean"))
  if (view == "manual_line") yr <- range(yr, lapply(runs, function(r) r$groups$manual))
  if (view == "ols") yr <- range(yr, lapply(runs, function(r) r$groups$ols))
  yr <- yr + c(-1,1)*diff(yr)*.06
  risk_max <- max(vapply(runs, function(r) max(energy_metric(r,"mse_mean") +
    (c(40,240)-energy_metric(r,"population_mean"))^2), numeric(1)))
  ymax <- if (view == "constant") max(vapply(runs, function(r) {
    xx <- seq(0,250,length.out=2001)
    s <- as.numeric(energy_setting(r,"sigma"))
    max(vapply(xx, function(x) sum(r$groups$probability *
      dunif(x,r$groups$conditional_mean-sqrt(3)*s,r$groups$conditional_mean+sqrt(3)*s)), numeric(1)))
  }, numeric(1))) else 1
  list(y=yr, density=c(0,ymax*1.2), risk=c(0,risk_max*1.08))
}
energy_plot <- function(r, view, limits = energy_limits(list(r), view)) {
  blue <- "#005A85"; orange <- "#B45A20"; green <- "#267356"; ink <- "#182632"
  metric <- function(key) energy_metric(r,key)
  setting <- function(key) energy_setting(r,key)
  num <- function(key) as.numeric(setting(key))
  g <- r$groups; d <- r$data; grid <- seq(5,35,length.out=241); z <- grid-20
  cef <- 80+.45*z^2
  degree <- as.integer(setting("degree"))
  proj <- metric("population_intercept")+metric("population_slope")*z+metric("population_quadratic")*z^2
  fit <- metric("sample_intercept")+metric("sample_slope")*z+metric("sample_quadratic")*z^2
  par(family=getOption("econometrics.font","sans"), col=ink,col.axis=ink,col.lab=ink,fg=ink,
      las=1,bty="l",mar=c(4.4,7.8,2.6,1.0),mgp=c(2.8,.7,0),cex=1,xpd=FALSE)
  layout(matrix(1:2,ncol=1),heights=c(5,1.2))
  plot <- function(..., ylab="") {graphics::plot(...,ylab=""); mtext(ylab,side=3,line=.5,adj=0,cex=.84)}
  labels <- character(); colors <- character(); types <- numeric(); points <- numeric()
  legend_data <- function(labs,cols,lty,pch=rep(NA,length(labs))) {
    labels <<- labs; colors <<- cols; types <<- lty; points <<- pch
  }
  if (view == "constant") {
    xx <- seq(0,250,length.out=2001); s <- num("sigma")
    density <- vapply(xx,function(x) sum(g$probability * dunif(x,g$conditional_mean-sqrt(3)*s,g$conditional_mean+sqrt(3)*s)),numeric(1))
    plot(xx,density,type="l",col=blue,lwd=2.5,xlim=c(0,250),ylim=limits$density,
         xlab="1日の電力使用量（kWh）",ylab="確率密度")
    abline(v=num("constant"),col=orange,lwd=3)
    abline(v=metric("population_mean"),col=green,lwd=3,lty=2)
    legend_data(c("使用量の分布","入力した予測値","全体の平均"),c(blue,orange,green),c(1,1,2))
  } else if (view == "constant_risk") {
    xx <- seq(40,240,length.out=401)
    plot(xx,metric("mse_mean")+(xx-metric("population_mean"))^2,type="l",col=ink,lwd=2.5,
         xlim=c(40,240),ylim=limits$risk,xlab="毎日同じ予測値（kWh）",ylab="平均二乗誤差（kWh²）")
    graphics::points(num("constant"),metric("mse_chosen_constant"),pch=16,col=orange,cex=1.4)
    graphics::points(metric("population_mean"),metric("mse_mean"),pch=1,col=green,cex=1.6,lwd=3)
    legend_data(c("入力した予測値","全体の平均"),c(orange,green),c(NA,NA),c(16,1))
  } else if (view == "climate") {
    at <- barplot(g$probability*100,names.arg=g$t,col=ifelse(g$t<20,blue,ifelse(g$t>20,orange,green)),
      border=NA,ylim=c(0,27),xlab="気温（℃）",ylab="",cex.names=1)
    mtext("その気温の日の割合（％）",side=3,line=.5,adj=0,cex=.84)
    text(at,g$probability*100+1.6,format(round(g$probability*100,1),trim=TRUE),cex=.82)
    legend_data(c("寒い日","穏やかな日","暑い日"),c(blue,green,orange),rep(NA,3),rep(15,3))
  } else {
    plot(NA,xlim=c(3,37),ylim=limits$y,xaxt="n",xlab="気温（℃）",ylab="1日の電力使用量（kWh）")
    axis(1,at=g$t)
    if (view %in% c("conditional","manual_line","ols")) {
      offset <- ((seq_len(nrow(d))*.61803398875)%%1-.5)*.65
      graphics::points(d$t+offset,d$y,pch=16,col=adjustcolor(ink,.22),cex=.65)
    }
    if (view == "conditional") {
      selected <- d$t == num("temperature")
      graphics::points(d$t[selected]+offset[selected],d$y[selected],pch=16,col=adjustcolor(blue,.7),cex=.7)
      lines(grid,cef,col=blue,lwd=2.8)
      graphics::points(g$t,g$conditional_mean,pch=16,col=blue,cex=.75)
      graphics::points(num("temperature"),metric("selected_mean"),pch=1,col=blue,cex=1.8,lwd=3)
      abline(h=metric("population_mean"),col=green,lwd=2.5,lty=2)
      legend_data(c("気温別の平均","全体の平均"),c(blue,green),c(1,2))
    } else if (view == "manual_line") {
      lines(grid,cef,col=blue,lwd=2.8)
      lines(grid,num("intercept")+num("slope")*z,col=orange,lwd=2.5)
      lines(grid,metric("linear_intercept")+metric("linear_slope")*z,col=green,lwd=2.8,lty=2)
      legend_data(c("気温別の平均","入力した直線","最適な直線"),c(blue,orange,green),c(1,1,2))
    } else if (view == "projection") {
      lines(grid,cef,col=blue,lwd=4)
      graphics::points(g$t,g$conditional_mean,pch=16,col=blue,cex=.75)
      lines(grid,proj,col=green,lwd=2.8,lty=2)
      legend_data(c("気温別の平均",if(degree==1) "直線による射影" else "二次項を含む射影"),c(blue,green),c(1,2))
    } else if (view == "ols") {
      lines(grid,proj,col=green,lwd=4)
      lines(grid,fit,col=ink,lwd=2.5,lty=2)
      legend_data(c("母集団の線形射影","標本からのOLS"),c(green,ink),c(1,2))
    } else stop("未定義の図：",view)
  }
  bounds <- par("usr")
  par(mar=c(.2,.4,.2,.4),xpd=NA); plot.new()
  graphics::legend("center",legend=labels,col=colors,lty=types,pch=points,lwd=2.5,
                   ncol=2,bty="n",cex=.78,y.intersp=1.6)
  invisible(bounds)
}
