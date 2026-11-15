package com.yvanlos.trade_task_manager.repository;
import com.yvanlos.trade_task_manager.model.TradeTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeTaskRepository extends JpaRepository<TradeTask,Long> {
    List<TradeTask> findByStatus(String status);

    //1. Native SQL-Abfrage: Fallunabhängige Volltextsuche mit PostgreSQL ILIKE
    @Query(value = "SELECT * FROM trade_tasks WHERE title ILIKE %:keyword% ORDER BY id DESC", nativeQuery = true)
    List<TradeTask> searchByTitleNative(@Param("keyword") String keyword);

    //2. Native SQL-Abfrage: Aggregation & Gruppierung nach Status (Statistik)
    @Query(value = "SELECT status, COUNT(*) AS count FROM trade_tasks GROUP BY status",nativeQuery = true)
    List<Object[]> countTasksGroupedByStatusNative();
}
