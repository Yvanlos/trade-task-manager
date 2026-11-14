package com.yvanlos.trade_task_manager.repository;
import com.yvanlos.trade_task_manager.model.TradeTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface TradeTaskRepository extends JpaRepository<TradeTask,Long> {
    List<TradeTask> findByStatus(String status);
}
